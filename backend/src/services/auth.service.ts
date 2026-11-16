import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { User, PasswordResetToken, toPublicUser } from '@/models';
import type { PublicUser } from '@/types';
import { AppError, isDuplicateKey } from '@/utils/AppError';
import { recordAudit } from '@/services/audit.service';
import { sendPasswordResetEmail } from '@/services/email.service';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@/validators/auth.validator';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

let dummyHash: Promise<string> | null = null;

function placeholderHash(): Promise<string> {
  dummyHash ??= bcrypt.hash('invalid-password', BCRYPT_ROUNDS);
  return dummyHash;
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function registerStudent(input: RegisterInput, ip?: string): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const user = await User.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: 'student',
      status: 'active',
      studentRegNo: input.studentRegNo,
    });
    await recordAudit({
      userId: String(user._id),
      action: 'auth.register',
      targetType: 'user',
      targetId: String(user._id),
      ip,
      meta: { email: user.email },
    });
    return toPublicUser(user);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, 'An account with this email already exists');
    }
    throw error;
  }
}

export async function login(input: LoginInput, ip?: string): Promise<PublicUser> {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const hash = user?.get('passwordHash') as string | undefined;
  const matches = await bcrypt.compare(input.password, hash ?? (await placeholderHash()));

  if (!user || !matches) {
    await recordAudit({
      action: 'auth.login_failed',
      targetType: 'user',
      targetId: user ? String(user._id) : undefined,
      ip,
      meta: { email: input.email },
    });
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new AppError(403, 'This account is suspended');
  }

  await recordAudit({
    userId: String(user._id),
    action: 'auth.login',
    targetType: 'user',
    targetId: String(user._id),
    ip,
  });

  return toPublicUser(user);
}

export async function logout(userId: string | undefined, ip?: string): Promise<void> {
  if (!userId) {
    return;
  }
  await recordAudit({
    userId,
    action: 'auth.logout',
    targetType: 'user',
    targetId: userId,
    ip,
  });
}

export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await User.findById(userId);
  if (!user || user.status !== 'active') {
    throw new AppError(401, 'Authentication required');
  }
  return toPublicUser(user);
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await User.findOne({
    email: input.email,
    status: 'active',
  });

  // Do not reveal whether an account exists.
  if (!user) return;

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetToken.deleteMany({ user: user._id });

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = new URL('/reset-password', env.CLIENT_URL);
  resetUrl.searchParams.set('token', rawToken);

  try {
    await sendPasswordResetEmail(user.email, resetUrl.toString());
  } catch (error) {
    await PasswordResetToken.deleteMany({ user: user._id });
    logger.error({ err: error }, 'Failed to send password reset email');
  }
}

export async function resetPassword(input: ResetPasswordInput, ip?: string): Promise<void> {
  const tokenHash = hashResetToken(input.token);

  // Find and consume the token so it cannot be reused.
  const resetToken = await PasswordResetToken.findOneAndDelete({
    tokenHash,
  });

  if (!resetToken || resetToken.expiresAt <= new Date()) {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  const user = await User.findById(resetToken.user);

  if (!user || user.status !== 'active') {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  user.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  await user.save();

  // Invalidate any other outstanding reset tokens for this account.
  await PasswordResetToken.deleteMany({ user: user._id });

  await recordAudit({
    userId: String(user._id),
    action: 'auth.password_reset',
    targetType: 'user',
    targetId: String(user._id),
    ip,
  });
}
