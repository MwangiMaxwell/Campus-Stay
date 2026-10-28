import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from '@/validators/common';

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(80),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  studentRegNo: z.string().trim().min(2).max(32).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password').max(72),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(256),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
