import { Router } from 'express';
import { mpesaCallback, stkPush } from '@/controllers/mpesa.controller';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validate } from '@/middleware/validate';
import { mpesaCallbackSchema, stkPushSchema } from '@/validators/payment.validator';

export const mpesaRouter = Router();

mpesaRouter.post(
  '/stk-push',
  authenticate,
  requireRole('student'),
  validate({ body: stkPushSchema }),
  stkPush,
);
mpesaRouter.post('/callback', validate({ body: mpesaCallbackSchema }), mpesaCallback);
