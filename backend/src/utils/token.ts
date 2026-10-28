import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { AuthUser } from '@/types';

export function signToken(user: AuthUser): string {
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };
  return jwt.sign({ role: user.role, email: user.email }, env.JWT_SECRET, options);
}
