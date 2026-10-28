import { handleStkCallback, initiateStkPush } from '@/services/mpesa.service';
import { AppError } from '@/utils/AppError';
import { asyncHandler } from '@/utils/asyncHandler';
import type { MpesaCallbackInput, StkPushInput } from '@/validators/payment.validator';

export const stkPush = asyncHandler(async (req) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const body = req.validated?.body as StkPushInput;
  await initiateStkPush(req.user.id, body);
});

export const mpesaCallback = asyncHandler(async (req) => {
  const body = req.validated?.body as MpesaCallbackInput;
  await handleStkCallback(body);
});
