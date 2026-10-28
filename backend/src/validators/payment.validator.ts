import { z } from 'zod';
import { objectIdSchema, phoneSchema } from '@/validators/common';

export const createPaymentSchema = z.object({
  bookingId: objectIdSchema,
  phoneNumber: phoneSchema,
});

export const stkPushSchema = createPaymentSchema;

export const mpesaCallbackSchema = z.object({
  Body: z
    .object({
      stkCallback: z
        .object({
          MerchantRequestID: z.string().optional(),
          CheckoutRequestID: z.string().optional(),
          ResultCode: z.number().optional(),
          ResultDesc: z.string().optional(),
          CallbackMetadata: z.unknown().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type StkPushInput = z.infer<typeof stkPushSchema>;
export type MpesaCallbackInput = z.infer<typeof mpesaCallbackSchema>;
