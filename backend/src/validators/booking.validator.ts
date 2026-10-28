import { z } from 'zod';
import { dateStringSchema, objectIdSchema } from '@/validators/common';

export const createBookingSchema = z
  .object({
    roomId: objectIdSchema,
    checkInDate: dateStringSchema,
    checkOutDate: dateStringSchema,
  })
  .refine((value) => Date.parse(value.checkOutDate) > Date.parse(value.checkInDate), {
    message: 'Check-out must be after check-in',
    path: ['checkOutDate'],
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
