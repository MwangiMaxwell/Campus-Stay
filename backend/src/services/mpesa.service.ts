import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import type { MpesaCallbackInput, StkPushInput } from '@/validators/payment.validator';

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
    throw new AppError(500, `M-Pesa is not configured. Missing: ${missing.join(', ')}`);
  }
}

// TODO(member-4): send an STK push through the Daraja API and store the pending payment.
export async function initiateStkPush(_userId: string, _input: StkPushInput): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): verify the callback, update the payment, and write a payment.success or payment.failure audit entry.
export async function handleStkCallback(_input: MpesaCallbackInput): Promise<never> {
  throw new AppError(501, 'Not implemented');
}
