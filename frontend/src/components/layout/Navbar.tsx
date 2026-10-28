'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const studentLinks = [
  { href: '/rooms', label: 'Rooms' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/payments', label: 'Payments' },
  { href: '/profile', label: 'Profile' },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/rooms', label: 'Rooms' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/reports', label: 'Reports' },
];

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const links = user?.role === 'student' ? studentLinks : user ? adminLinks : [];

  async function onLogout() {
    await logout();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <Image src="/logo.svg" alt="" width={32} height={32} />
          CampusStay
        </Link>
        <button
          type="button"
          className="rounded-lg border border-line px-3 py-1.5 text-sm md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <nav
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 z-10 flex-col gap-3 border-b border-line bg-card px-4 py-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink hover:text-brand"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <button
              type="button"
              className="text-left text-sm font-semibold text-brand"
              onClick={() => void onLogout()}
            >
              Log out
            </button>
          ) : (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Link href="/login" className="text-sm font-semibold text-ink">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white"
              >
                Create account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
