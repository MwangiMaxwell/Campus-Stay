'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BedDouble,
  CircleDollarSign,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Menu,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { href: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
  { href: '/admin/users', label: 'Students', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: FileBarChart },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeLabel = nav.find((item) => isActive(pathname, item.href))?.label ?? 'Overview';
  const firstName = user?.fullName.split(' ')[0] ?? 'there';
  const initials = (user?.fullName ?? 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  async function onLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#173d39]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[#dedbd4] bg-[#fbfaf7] p-5 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-[#173d39] text-[#f8f4eb]">
              <BedDouble className="size-4" />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">CampusStay</span>
          </Link>
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="mt-12 flex flex-1 flex-col gap-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#98a29c]">
            Workspace
          </p>
          {nav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${active ? 'bg-[#e9f1e6] text-[#173d39]' : 'text-[#7b8781] hover:bg-[#f1efe9] hover:text-[#173d39]'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>
        <div className="rounded-2xl bg-[#173d39] p-4 text-[#f8f4eb]">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="size-2 rounded-full bg-[#d7ed82]" /> Signed in
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#b9d1c5]">{user?.email}</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-[#d7ed82]"
            onClick={() => void onLogout()}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-20 items-center justify-between border-b border-[#dedbd4] bg-[#f5f3ef]/90 px-6 backdrop-blur-md lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu />
            </button>
            <div>
              <p className="text-xs text-[#8b9790]">CampusStay / {activeLabel}</p>
              <h1 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
                Good to see you, {firstName}
              </h1>
            </div>
          </div>
          <div className="grid size-9 place-items-center rounded-full bg-[#c6d6c8] text-xs font-bold text-[#31564e]">
            {initials}
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
