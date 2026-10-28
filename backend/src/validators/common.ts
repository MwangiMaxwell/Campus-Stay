import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParamsSchema = z.object({
  id: objectIdSchema,
});

export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[0-9]{10,15}$/,
    'Enter a phone number with 10 to 15 digits. A leading + is optional.',
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), {
    message: 'Use at least one letter and one number',
  });

export const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: 'Enter a valid date',
});

const pageSchema = z
  .string()
  .regex(/^[1-9]\d*$/, 'Page must be a positive whole number')
  .default('1')
  .transform(Number);

const limitSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-4]\d|50)$/, 'Limit must be a whole number from 1 to 50')
  .default('10')
  .transform(Number);

export const paginationQuerySchema = {
  page: pageSchema,
  limit: limitSchema,
};

export type IdParams = z.infer<typeof idParamsSchema>;
