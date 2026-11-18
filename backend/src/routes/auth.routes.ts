import { Router } from 'express';
import {
  changeMyPassword,
  forgotPassword,
  loginUser,
  logoutUser,
  me,
  register,
  resetPassword,
  updateMe,
} from '@/controllers/auth.controller';
import { authenticate, optionalAuthenticate } from '@/middleware/authenticate';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { validate } from '@/middleware/validate';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@/validators/auth.validator';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authRateLimiter, validate({ body: loginSchema }), loginUser);
authRouter.post('/logout', optionalAuthenticate, logoutUser);
authRouter.get('/me', authenticate, me);
authRouter.patch('/me', authenticate, validate({ body: updateProfileSchema }), updateMe);
authRouter.post(
  '/change-password',
  authenticate,
  authRateLimiter,
  validate({ body: changePasswordSchema }),
  changeMyPassword,
);
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
