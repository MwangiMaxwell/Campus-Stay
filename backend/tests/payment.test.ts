import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLog, Booking, Hostel, Payment, Room } from '@/models';
import { env } from '@/config/env';
import { handleStkCallback } from '@/services/mpesa.service';
import { agent, createAccount } from './helpers';

const originalMpesaConfig = {
  MPESA_CONSUMER_KEY: env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: env.MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE: env.MPESA_SHORTCODE,
  MPESA_PASSKEY: env.MPESA_PASSKEY,
  MPESA_CALLBACK_URL: env.MPESA_CALLBACK_URL,
};

async function createStudentSession(email: string) {
  const user = await createAccount('student', email);
  const session = agent();

  const login = await session.post('/api/v1/auth/login').send({
    email,
    password: 'Student#2026',
  });

  expect(login.status).toBe(200);

  return { user, session };
}

async function createTestBooking(userId: string, email: string) {
  const manager = await createAccount('student', `manager-${email}`);

  const hostel = await Hostel.create({
    name: 'Payment Test Hostel',
    location: 'Nairobi',
    contactPhone: '+254700000099',
    manager: manager._id,
  });

  const room = await Room.create({
    hostel: hostel._id,
    roomNumber: 'PAY-101',
    roomType: 'single',
    price: 7000,
    capacity: 1,
    availabilityStatus: 'booked',
  });

  const booking = await Booking.create({
    user: userId,
    room: room._id,
    bookingDate: new Date(),
    checkInDate: new Date('2026-12-01'),
    checkOutDate: new Date('2027-01-01'),
    status: 'pending',
  });

  return { booking, room };
}

function configureMpesa() {
  Object.assign(env, {
    MPESA_CONSUMER_KEY: 'test-consumer-key',
    MPESA_CONSUMER_SECRET: 'test-consumer-secret',
    MPESA_SHORTCODE: '174379',
    MPESA_PASSKEY: 'test-passkey',
    MPESA_CALLBACK_URL: 'https://example.test/api/v1/mpesa/callback',
  });
}

function mockSuccessfulStkPush() {
  const fetchMock = vi.fn();

  fetchMock
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'test-access-token' }), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ResponseCode: '0',
          ResponseDescription: 'Success',
          CustomerMessage: 'STK Push sent',
          CheckoutRequestID: 'ws_CO_TEST123',
          MerchantRequestID: 'merchant_TEST123',
        }),
        { status: 200 },
      ),
    );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

describe('student payments', () => {
  beforeEach(() => {
    configureMpesa();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.assign(env, originalMpesaConfig);
  });

  it('initiates payment using the room price, not the frontend amount', async () => {
    const { user, session } = await createStudentSession('payment1@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment1');

    const fetchMock = mockSuccessfulStkPush();

    const response = await session.post('/api/v1/payments').send({
      bookingId: String(booking._id),
      phoneNumber: '+254711000001',
      amount: 1,
    });
    console.log('PAYMENT INITIATION RESPONSE:', response.body);
    expect(response.status).toBe(201);
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.payment.amount).toBe(7000);

    const payment = await Payment.findOne({ booking: booking._id });
    expect(payment?.amount).toBe(7000);
    expect(payment?.status).toBe('pending');
    expect(payment?.checkoutRequestId).toBe('ws_CO_TEST123');

    const stkPayload = JSON.parse(fetchMock.mock.calls[1][1].body as string);

    expect(stkPayload.Amount).toBe(7000);
    expect(stkPayload.PhoneNumber).toBe('254711000001');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not allow a student to pay for another student’s booking', async () => {
    const firstStudent = await createStudentSession('payment2@campusstay.test');

    const { booking } = await createTestBooking(String(firstStudent.user._id), 'payment2');

    const secondStudent = await createStudentSession('payment3@campusstay.test');

    const response = await secondStudent.session.post('/api/v1/payments').send({
      bookingId: String(booking._id),
      phoneNumber: '+254711000002',
    });

    expect(response.status).toBe(404);
    expect(await Payment.countDocuments()).toBe(0);
  });

  it('rejects a second payment while one is already pending', async () => {
    const { user, session } = await createStudentSession('payment4@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment4');

    await Payment.create({
      booking: booking._id,
      amount: 7000,
      phoneNumber: '254711000001',
      status: 'pending',
      checkoutRequestId: 'existing-checkout',
    });

    const response = await session.post('/api/v1/payments').send({
      bookingId: String(booking._id),
      phoneNumber: '+254711000001',
    });

    console.log('SECOND PAYMENT RESPONSE:', response.body);
    expect(response.status).toBe(409);
    expect(response.status).toBe(409);
    expect(await Payment.countDocuments()).toBe(1);
  });

  it('rejects payment for a booking that does not exist', async () => {
    const { session } = await createStudentSession('payment5@campusstay.test');

    const response = await session.post('/api/v1/payments').send({
      bookingId: '507f1f77bcf86cd799439011',
      phoneNumber: '+254711000001',
    });

    expect(response.status).toBe(404);
  });

  it('marks a payment successful when Safaricom confirms payment', async () => {
    const { user } = await createStudentSession('payment6@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment6');

    const payment = await Payment.create({
      booking: booking._id,
      amount: 7000,
      phoneNumber: '254711000001',
      checkoutRequestId: 'callback-success-123',
      status: 'pending',
    });

    const result = await handleStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: 'callback-success-123',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'MpesaReceiptNumber', Value: 'QWE123456' },
              { Name: 'Amount', Value: 7000 },
            ],
          },
        },
      },
    });

    expect(result.duplicate).toBe(false);

    const updatedPayment = await Payment.findById(payment._id);

    expect(updatedPayment?.status).toBe('success');
    expect(updatedPayment?.mpesaReceiptNo).toBe('QWE123456');
    expect(updatedPayment?.paymentDate).toBeDefined();

    const logs = await AuditLog.find({ action: 'payment.success' });
    expect(logs).toHaveLength(1);
  });

  it('marks a payment failed when Safaricom rejects payment', async () => {
    const { user } = await createStudentSession('payment7@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment7');

    const payment = await Payment.create({
      booking: booking._id,
      amount: 7000,
      phoneNumber: '254711000001',
      checkoutRequestId: 'callback-failed-123',
      status: 'pending',
    });

    await handleStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: 'callback-failed-123',
          ResultCode: 1032,
          ResultDesc: 'Request cancelled by user',
        },
      },
    });

    const updatedPayment = await Payment.findById(payment._id);

    expect(updatedPayment?.status).toBe('failed');

    const logs = await AuditLog.find({ action: 'payment.failure' });
    expect(logs).toHaveLength(1);
  });

  it('does not create another audit entry for a duplicate callback', async () => {
    const { user } = await createStudentSession('payment8@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment8');

    await Payment.create({
      booking: booking._id,
      amount: 7000,
      phoneNumber: '254711000001',
      checkoutRequestId: 'callback-duplicate-123',
      status: 'pending',
    });

    const callback = {
      Body: {
        stkCallback: {
          CheckoutRequestID: 'callback-duplicate-123',
          ResultCode: 0,
          ResultDesc: 'Success',
        },
      },
    };

    await handleStkCallback(callback);
    const secondResult = await handleStkCallback(callback);

    expect(secondResult.duplicate).toBe(true);

    const logs = await AuditLog.find({ action: 'payment.success' });
    expect(logs).toHaveLength(1);
  });

  it('returns the student’s own payment history', async () => {
    const { user, session } = await createStudentSession('payment9@campusstay.test');

    const { booking } = await createTestBooking(String(user._id), 'payment9');

    await Payment.create({
      booking: booking._id,
      amount: 7000,
      phoneNumber: '254711000001',
      status: 'pending',
    });

    const response = await session.get('/api/v1/payments');
    console.log('PAYMENT HISTORY RESPONSE:', response.body);
    expect(response.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });
});
