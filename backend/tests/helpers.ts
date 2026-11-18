import bcrypt from 'bcryptjs';
import request from 'supertest';
import { User } from '@/models';
import type { UserRole } from '@/types';
import { createApp } from '@/app';

export const app = createApp();

export const studentPayload = {
  fullName: 'Amina Wanjiku',
  email: 'amina@campusstay.test',
  phone: '+254711000001',
  password: 'Student#2026',
  studentRegNo: 'SCT-1001',
};

export async function createAccount(
  role: UserRole,
  email: string,
  status: 'active' | 'suspended' = 'active',
) {
  return User.create({
    fullName: 'Test User',
    email,
    phone: '+254700000099',
    passwordHash: await bcrypt.hash('Student#2026', 12),
    role,
    status,
  });
}

export function agent() {
  return request.agent(app);
}

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString();
}

// Stay dates relative to today so tests never go stale.
export function stayDates(startInDays = 14, lengthInDays = 30) {
  return {
    checkInDate: isoDay(startInDays),
    checkOutDate: isoDay(startInDays + lengthInDays),
  };
}

export async function login(email: string) {
  const session = agent();
  const response = await session.post('/api/v1/auth/login').send({
    email,
    password: 'Student#2026',
  });
  if (response.status !== 200) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }
  return session;
}
