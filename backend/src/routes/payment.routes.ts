import { Router } from 'express';
import { getPaymentById, getPayments, postPayment } from '@/controllers/payment.controller';
import { authenticate } from '@/middleware/authenticate';
import { requireRole } from '@/middleware/requireRole';
import { validate } from '@/middleware/validate';
import { idParamsSchema } from '@/validators/common';
import { createPaymentSchema } from '@/validators/payment.validator';

export const paymentRouter = Router();

paymentRouter.use(authenticate, requireRole('student'));
paymentRouter.post('/', validate({ body: createPaymentSchema }), postPayment);
paymentRouter.get('/', getPayments);
paymentRouter.get('/:id', validate({ params: idParamsSchema }), getPaymentById);
