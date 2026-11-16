import { createPayment, getPayment, listPayments } from '@/services/payment.service';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { IdParams } from '@/validators/common';
import type { CreatePaymentInput } from '@/validators/payment.validator';

export const postPayment = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const body = req.validated?.body as CreatePaymentInput;
  const payment = await createPayment(req.user.id, body);

  sendSuccess(res, payment, 201);
});

export const getPayments = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const payments = await listPayments(req.user.id);

  sendSuccess(res, payments);
});

export const getPaymentById = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const params = req.validated?.params as IdParams;
  const payment = await getPayment(req.user.id, params.id);

  sendSuccess(res, payment);
});
