import type { UserRole } from '@/types';

export type AccessDecision = { type: 'allow' } | { type: 'redirect'; pathname: string };

const STUDENT_PREFIXES = ['/rooms', '/bookings', '/payments', '/profile'];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function decideAccess(pathname: string, user: { role: UserRole } | null): AccessDecision {
  const adminArea = matchesPrefix(pathname, '/admin');
  const studentArea = STUDENT_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

  if (!adminArea && !studentArea) {
    return { type: 'allow' };
  }

  if (!user) {
    return { type: 'redirect', pathname: `/login?next=${encodeURIComponent(pathname)}` };
  }

  if (adminArea && user.role === 'student') {
    return { type: 'redirect', pathname: '/rooms' };
  }

  return { type: 'allow' };
}

export function safeNextPath(value: string | null, role: UserRole): string {
  const fallback = role === 'student' ? '/rooms' : '/admin';
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('://')) {
    return fallback;
  }
  if (value.startsWith('/login') || value.startsWith('/register')) {
    return fallback;
  }
  if (matchesPrefix(value, '/admin') && role === 'student') {
    return '/rooms';
  }
  return value;
}
