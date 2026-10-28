import bcrypt from 'bcryptjs';
import { User, toPublicUser } from '@/models';
import type { PublicUser } from '@/types';
import { AppError, isDuplicateKey } from '@/utils/AppError';
import { recordAudit } from '@/services/audit.service';
import type { LoginInput, RegisterInput } from '@/validators/auth.validator';

const BCRYPT_ROUNDS = 12;
let dummyHash: Promise<string> | null = null;

function placeholderHash(): Promise<string> {
  dummyHash ??= bcrypt.hash('invalid-password', BCRYPT_ROUNDS);
  return dummyHash;
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
