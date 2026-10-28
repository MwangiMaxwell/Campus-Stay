import { createPayment, getPayment, listPayments } from '@/services/payment.service';
import { AppError } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import type { IdParams } from '@/validators/common';
import type { CreatePaymentInput } from '@/validators/payment.validator';

export const postPayment = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const body = req.validated?.body as CreatePaymentInput;
  await createPayment(req.user.id, body);
});

export const getPayments = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  await listPayments(req.user.id);
});

export const getPaymentById = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const params = req.validated?.params as IdParams;
  await getPayment(req.user.id, params.id);
});
