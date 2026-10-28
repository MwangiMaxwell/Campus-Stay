import { getCurrentUser, login, logout, registerStudent } from '@/services/auth.service';
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

// TODO(member-4): create a password reset token and send the reset instructions.
export const forgotPassword = asyncHandler(async (req) => {
  const _body = req.validated?.body as ForgotPasswordInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});

// TODO(member-4): verify the reset token, replace the password hash, and write an auth.password_reset audit entry.
export const resetPassword = asyncHandler(async (req) => {
  const _body = req.validated?.body as ResetPasswordInput;
  void _body;
  throw new AppError(501, 'Not implemented');
});
