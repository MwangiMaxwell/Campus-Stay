import { createPayment } from '@/services/payment.service';
import { handleStkCallback } from '@/services/mpesa.service';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import type { MpesaCallbackInput, StkPushInput } from '@/validators/payment.validator';

export const stkPush = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const body = req.validated?.body as StkPushInput;
  const payment = await createPayment(req.user.id, body);

  sendSuccess(res, payment, 201);
});

export const mpesaCallback = asyncHandler(async (req, res) => {
  const body = req.validated?.body as MpesaCallbackInput;
  const result = await handleStkCallback(body);

  sendSuccess(res, result);
});
