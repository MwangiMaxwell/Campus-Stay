import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), {
    message: 'Use at least one letter and one number',
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
    phone: z
      .string()
      .trim()
      .regex(
        /^\+?[0-9]{10,15}$/,
        'Enter a phone number with 10 to 15 digits. A leading + is optional.',
      ),
    studentRegNo: z
      .string()
      .trim()
      .refine((value) => value.length === 0 || (value.length >= 2 && value.length <= 32), {
        message: 'Use 2 to 32 characters, or leave this blank',
      }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
