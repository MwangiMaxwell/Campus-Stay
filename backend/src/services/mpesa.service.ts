import { randomBytes, randomUUID } from 'node:crypto';
import { env } from '@/config/env';
import { Booking, Payment } from '@/models';
import { recordAudit } from '@/services/audit.service';
import { sendPaymentConfirmationEmail } from '@/services/email.service';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import type { MpesaCallbackInput, StkPushInput } from '@/validators/payment.validator';

// How long the simulated phone prompt takes before it "completes".
export const SIMULATED_PROMPT_DELAY_MS = 4000;

const REQUIRED = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
] as const;

export function assertMpesaConfigured(): void {
  const missing = REQUIRED.filter((key) => env[key].trim() === '');

  if (missing.length > 0) {
    throw new AppError(503, `M-Pesa is not configured. Missing: ${missing.join(', ')}`);
  }
}

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith('254')) {
    return digits;
  }

  throw new AppError(400, 'Use a valid Kenyan M-Pesa phone number');
}

function getDarajaBaseUrl(): string {
  return env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${env.MPESA_CONSUMER_KEY}:${env.MPESA_CONSUMER_SECRET}`,
  ).toString('base64');

  const response = await fetch(
    `${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  const data = (await response.json()) as {
    access_token?: string;
  };

  if (!response.ok || !data.access_token) {
    throw new AppError(502, 'Could not authenticate with Safaricom Daraja');
  }

  return data.access_token;
}

function getMpesaTimestamp(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

// Local development stand-in for Safaricom. It creates the same pending payment and then
// delivers a callback through the real handler, so the rest of the flow is exercised as in
// production. A phone number ending in 0000 simulates a customer who cancels the prompt.
async function simulateStkPush(userId: string, input: StkPushInput, amount: number) {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  const checkoutRequestId = `sim_ws_CO_${randomUUID()}`;

  const payment = await Payment.create({
    booking: input.bookingId,
    amount,
    phoneNumber,
    status: 'pending',
    checkoutRequestId,
    merchantRequestId: `sim_merchant_${randomUUID()}`,
  });

  await recordAudit({
    userId,
    action: 'payment.initiated',
    targetType: 'payment',
    targetId: String(payment._id),
    meta: { bookingId: input.bookingId, amount, phoneNumber, simulated: true },
  });

  const cancelled = phoneNumber.endsWith('0000');
  const timer = setTimeout(() => {
    handleStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: checkoutRequestId,
          ResultCode: cancelled ? 1032 : 0,
          ResultDesc: cancelled
            ? 'Request cancelled by user'
            : 'The service request is processed successfully.',
          CallbackMetadata: cancelled
            ? undefined
            : {
                Item: [
                  { Name: 'Amount', Value: amount },
                  {
                    Name: 'MpesaReceiptNumber',
                    Value: `SIM${randomBytes(4).toString('hex').toUpperCase()}`,
                  },
                  { Name: 'PhoneNumber', Value: Number(phoneNumber) },
                ],
              },
        },
      },
    }).catch((error: unknown) => {
      logger.error({ err: error }, 'Simulated M-Pesa callback failed');
    });
  }, SIMULATED_PROMPT_DELAY_MS);
  timer.unref();

  return {
    payment,
    message:
      'Simulated M-Pesa prompt sent. It completes in a few seconds. Use a phone number ending in 0000 to simulate a cancelled prompt.',
  };
}

export async function initiateStkPush(userId: string, input: StkPushInput, amount: number) {
  if (env.MPESA_SIMULATE) {
    return simulateStkPush(userId, input, amount);
  }

  assertMpesaConfigured();

  const phoneNumber = normalizePhoneNumber(input.phoneNumber);
  const accessToken = await getAccessToken();

  const timestamp = getMpesaTimestamp();
  const password = Buffer.from(`${env.MPESA_SHORTCODE}${env.MPESA_PASSKEY}${timestamp}`).toString(
    'base64',
  );

  // Create the pending record before sending the STK request.
  const payment = await Payment.create({
    booking: input.bookingId,
    amount,
    phoneNumber,
    status: 'pending',
  });

  try {
    const response = await fetch(`${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: env.MPESA_CALLBACK_URL,
        AccountReference: 'CampusStay',
        TransactionDesc: 'CampusStay booking payment',
      }),
    });

    const data = (await response.json()) as {
      ResponseCode?: string;
      ResponseDescription?: string;
      CustomerMessage?: string;
      CheckoutRequestID?: string;
      MerchantRequestID?: string;
    };

    if (!response.ok || data.ResponseCode !== '0' || !data.CheckoutRequestID) {
      throw new Error(data.ResponseDescription || 'Safaricom rejected the STK request');
    }

    payment.checkoutRequestId = data.CheckoutRequestID;
    payment.merchantRequestId = data.MerchantRequestID;
    await payment.save();

    await recordAudit({
      userId,
      action: 'payment.initiated',
      targetType: 'payment',
      targetId: String(payment._id),
      meta: {
        bookingId: input.bookingId,
        amount,
        phoneNumber,
      },
    });

    return {
      payment,
      message: data.CustomerMessage || 'STK Push sent. Check your phone.',
    };
  } catch (error) {
    payment.status = 'failed';
    await payment.save();

    await recordAudit({
      userId,
      action: 'payment.failure',
      targetType: 'payment',
      targetId: String(payment._id),
      meta: {
        bookingId: input.bookingId,
        reason: error instanceof Error ? error.message : 'STK request failed',
      },
    });

    throw new AppError(
      502,
      error instanceof Error ? error.message : 'Could not initiate the M-Pesa payment',
    );
  }
}

function getCallbackValue(metadata: unknown, name: string): unknown {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const items = (metadata as { Item?: unknown }).Item;

  if (!Array.isArray(items)) {
    return undefined;
  }

  const item = items.find(
    (entry) =>
      entry !== null &&
      typeof entry === 'object' &&
      'Name' in entry &&
      (entry as { Name?: unknown }).Name === name,
  );

  return item && typeof item === 'object' && 'Value' in item
    ? (item as { Value?: unknown }).Value
    : undefined;
}

export async function handleStkCallback(input: MpesaCallbackInput) {
  const callback = input.Body?.stkCallback;

  if (!callback?.CheckoutRequestID || typeof callback.ResultCode !== 'number') {
    throw new AppError(400, 'Invalid M-Pesa callback');
  }

  const payment = await Payment.findOne({
    checkoutRequestId: callback.CheckoutRequestID,
  });

  if (!payment) {
    throw new AppError(404, 'Payment for this M-Pesa request was not found');
  }

  // Ignore duplicate callbacks once a payment has been processed.
  if (payment.status !== 'pending') {
    return { received: true, duplicate: true };
  }

  const receipt = getCallbackValue(callback.CallbackMetadata, 'MpesaReceiptNumber');
  const paidAmount = getCallbackValue(callback.CallbackMetadata, 'Amount');

  // Never accept a success whose amount differs from the fee we asked for.
  const amountMismatch =
    callback.ResultCode === 0 && typeof paidAmount === 'number' && paidAmount !== payment.amount;
  const successful = callback.ResultCode === 0 && !amountMismatch;

  const updatedPayment = await Payment.findOneAndUpdate(
    {
      _id: payment._id,
      status: 'pending',
    },
    {
      $set: {
        status: successful ? 'success' : 'failed',
        paymentDate: successful ? new Date() : undefined,
        ...(successful && typeof receipt === 'string' ? { mpesaReceiptNo: receipt } : {}),
      },
    },
    { returnDocument: 'after' },
  );

  // Another callback may have processed this payment first.
  if (!updatedPayment) {
    return { received: true, duplicate: true };
  }

  const booking = await Booking.findById(payment.booking)
    .select('user room')
    .populate('user', 'fullName email')
    .populate({
      path: 'room',
      select: 'roomNumber hostel',
      populate: { path: 'hostel', select: 'name' },
    })
    .lean<{
      user: { _id: unknown; fullName: string; email: string } | null;
      room: { roomNumber: string; hostel: { name: string } | null } | null;
    } | null>();

  await recordAudit({
    userId: booking?.user ? String(booking.user._id) : undefined,
    action: successful ? 'payment.success' : 'payment.failure',
    targetType: 'payment',
    targetId: String(payment._id),
    meta: {
      checkoutRequestId: callback.CheckoutRequestID,
      resultCode: callback.ResultCode,
      resultDescription: amountMismatch
        ? `Amount mismatch: expected ${payment.amount}, received ${String(paidAmount)}`
        : callback.ResultDesc,
      receiptNumber: typeof receipt === 'string' ? receipt : undefined,
      amount: payment.amount,
    },
  });

  if (successful && booking?.user) {
    // The payment is already recorded, so a mail failure must not fail the callback.
    sendPaymentConfirmationEmail(booking.user.email, {
      fullName: booking.user.fullName,
      amount: payment.amount,
      receipt: typeof receipt === 'string' ? receipt : undefined,
      hostelName: booking.room?.hostel?.name,
      roomNumber: booking.room?.roomNumber,
    }).catch((error: unknown) => {
      logger.warn({ err: error }, 'Could not send the payment confirmation email');
    });
  }

  return { received: true, duplicate: false };
}
