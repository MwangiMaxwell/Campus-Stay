import { describe, expect, it } from 'vitest';
import { decideAccess, safeNextPath } from '@/lib/auth';
import { registerSchema } from '@/lib/schemas';

describe('decideAccess', () => {
  it('sends guests to login and keeps students out of admin', () => {
    expect(decideAccess('/rooms', null)).toEqual({
      type: 'redirect',
      pathname: '/login?next=%2Frooms',
    });
    expect(decideAccess('/admin/users', { role: 'student' })).toEqual({
      type: 'redirect',
      pathname: '/rooms',
    });
    expect(decideAccess('/admin', { role: 'admin' })).toEqual({ type: 'allow' });
    expect(decideAccess('/admin/reports', { role: 'super_admin' })).toEqual({ type: 'allow' });
    expect(decideAccess('/login', null)).toEqual({ type: 'allow' });
  });

  it('only follows a same-site next path', () => {
    expect(safeNextPath('/profile', 'student')).toBe('/profile');
    expect(safeNextPath('https://evil.test', 'student')).toBe('/rooms');
    expect(safeNextPath('/admin', 'student')).toBe('/rooms');
    expect(safeNextPath(null, 'admin')).toBe('/admin');
  });
});

describe('registerSchema', () => {
  it('rejects a weak password and a mismatched confirmation', () => {
    const weak = registerSchema.safeParse({
      fullName: 'Amina Wanjiku',
      email: 'amina@campusstay.test',
      phone: '+254711000001',
      password: 'password',
      confirmPassword: 'password',
    });
    expect(weak.success).toBe(false);

    const mismatch = registerSchema.safeParse({
      fullName: 'Amina Wanjiku',
      email: 'amina@campusstay.test',
      phone: '+254711000001',
      password: 'Student#2026',
      confirmPassword: 'Student#2027',
    });
    expect(mismatch.success).toBe(false);
  });
});
