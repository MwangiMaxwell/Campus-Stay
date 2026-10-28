import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '@/validators/common';

export const roomQuerySchema = z.object({
  hostel: objectIdSchema.optional(),
  roomType: z.enum(['single', 'double', 'triple', 'bedsitter']).optional(),
  minPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'minPrice must be a number')
    .transform(Number)
    .optional(),
  maxPrice: z
    .string()
    .regex(/^\d+(\.\d+)?$/, 'maxPrice must be a number')
    .transform(Number)
    .optional(),
  available: z.enum(['true', 'false']).optional(),
  ...paginationQuerySchema,
});

export type RoomQuery = z.infer<typeof roomQuerySchema>;
