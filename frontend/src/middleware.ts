import { NextResponse, type NextRequest } from 'next/server';
import { decideAccess } from '@/lib/auth';
import { readSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const user = await readSession(token);
  const decision = decideAccess(request.nextUrl.pathname, user);

  if (decision.type === 'redirect') {
    return NextResponse.redirect(new URL(decision.pathname, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/rooms',
    '/rooms/:path*',
    '/bookings',
    '/bookings/:path*',
    '/payments',
    '/payments/:path*',
    '/profile',
    '/profile/:path*',
  ],
};
