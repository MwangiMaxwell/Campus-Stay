'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BedDouble, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { href: '/rooms', label: 'Rooms' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/payments', label: 'Payments' },
  { href: '/profile', label: 'Profile' },
];

export function StudentFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#173d39]">
      <header className="sticky top-0 z-20 border-b border-[#dedbd4]/70 bg-[#f5f3ef]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#173d39] text-[#f8f4eb]">
              <BedDouble className="size-4" />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">CampusStay</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#68726e] md:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={active ? 'text-[#173d39]' : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && user.role !== 'student' ? <Link href="/admin">Admin</Link> : null}
            <button
              type="button"
              className="font-semibold text-[#173d39]"
              onClick={() => void onLogout()}
            >
              Log out
            </button>
          </nav>
          <button
            type="button"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open ? (
          <div className="flex flex-col gap-3 border-t border-[#dedbd4] px-6 py-4 text-sm font-medium md:hidden">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <button type="button" className="text-left" onClick={() => void onLogout()}>
              Log out
            </button>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
