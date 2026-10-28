'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/rooms', label: 'Rooms' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/reports', label: 'Reports' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function onLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  return (
    <aside className="border-b border-line bg-ink text-white md:min-h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-4 py-4 font-semibold">
        <Image src="/logo.svg" alt="" width={28} height={28} />
        CampusStay
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active ? 'bg-white/15' : 'hover:bg-white/10'}`}
              aria-current={active ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden px-4 py-4 text-sm text-white/70 md:block">
        <p>{user?.fullName}</p>
        <button type="button" className="mt-2 text-white" onClick={() => void onLogout()}>
          Log out
        </button>
      </div>
    </aside>
  );
}
