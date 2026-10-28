import { AppError } from '@/utils/AppError';
import type { CreatePaymentInput } from '@/validators/payment.validator';

// TODO(member-4): start a payment for a booking owned by the student. Do not trust an amount sent by the client.
export async function createPayment(_userId: string, _input: CreatePaymentInput): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): list payments for the signed-in student.
export async function listPayments(_userId: string): Promise<never> {
  throw new AppError(501, 'Not implemented');
}

// TODO(member-4): return one payment when it belongs to the signed-in student.
export async function getPayment(_userId: string, _paymentId: string): Promise<never> {
  throw new AppError(501, 'Not implemented');
}
