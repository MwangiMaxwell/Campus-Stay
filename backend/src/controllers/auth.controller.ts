import {
  getCurrentUser,
  login,
  logout,
  registerStudent,
  forgotPassword as requestPasswordReset,
  resetPassword as completePasswordReset,
} from '@/services/auth.service';
import type { PublicUser } from '@/types';
import { AppError } from '@/utils/AppError';
import { sendSuccess } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/asyncHandler';
import { clearAuthCookie, setAuthCookie } from '@/utils/cookies';
import { signToken } from '@/utils/token';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/validators/auth.validator';

function clientIp(req: { ip?: string }): string | undefined {
  return req.ip;
}

export const register = asyncHandler(async (req, res) => {
  const body = req.validated?.body as RegisterInput;
  const user = await registerStudent(body, clientIp(req));
  setAuthCookie(res, signToken(user));
  sendSuccess(res, { user }, 201);
});

export const loginUser = asyncHandler(async (req, res) => {
  const body = req.validated?.body as LoginInput;
  const user = await login(body, clientIp(req));
  setAuthCookie(res, signToken(user));
  sendSuccess(res, { user });
});

export const logoutUser = asyncHandler(async (req, res) => {
  await logout(req.user?.id, clientIp(req));
  clearAuthCookie(res);
  sendSuccess(res, { message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  const user: PublicUser = await getCurrentUser(req.user.id);
  sendSuccess(res, { user });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ForgotPasswordInput;
  await requestPasswordReset(body);
  sendSuccess(res, {
    message: 'If an account exists with that email, password reset instructions will be sent.',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const body = req.validated?.body as ResetPasswordInput;
  await completePasswordReset(body, clientIp(req));
  sendSuccess(res, { message: 'Password reset successfully' });
});
