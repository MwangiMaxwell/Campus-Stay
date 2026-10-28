import { Router } from 'express';
import {
  forgotPassword,
  loginUser,
  logoutUser,
  me,
  register,
  resetPassword,
} from '@/controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '@/middleware/authenticate';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { validate } from '@/middleware/validate';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), loginUser);
authRouter.post('/logout', optionalAuthenticate, logoutUser);
authRouter.get('/me', authenticate, me);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validate({ body: forgotPasswordSchema }),
  forgotPassword,
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validate({ body: resetPasswordSchema }),
  resetPassword,
);
