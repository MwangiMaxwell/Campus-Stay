'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BedDouble } from 'lucide-react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#173d39]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.04em]"
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#173d39] text-[#f8f4eb]">
            <BedDouble className="size-4" />
          </span>
          CampusStay
        </Link>
        <Link
          href={pathname === '/login' ? '/register' : '/login'}
          className="text-sm font-semibold text-[#53605c]"
        >
          {pathname === '/login' ? 'Create account' : 'Sign in'}
        </Link>
      </header>
      <div className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</div>
    </div>
  );
}
