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
