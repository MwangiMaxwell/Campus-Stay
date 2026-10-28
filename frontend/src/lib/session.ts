import { jwtVerify } from 'jose';
import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role;
    if (
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      (role === 'student' || role === 'admin' || role === 'super_admin')
    ) {
      return { id: payload.sub, email: payload.email, role };
    }
    return null;
  } catch {
    return null;
  }
}
