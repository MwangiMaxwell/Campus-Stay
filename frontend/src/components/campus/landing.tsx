'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BedDouble, Check, Menu, Search, ShieldCheck, X } from 'lucide-react';
import { CampusButton } from '@/components/campus/campus-button';
import { RoomCard } from '@/components/campus/room-card';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import type { RoomType } from '@/types';

const roomTypes: Array<{ value: '' | RoomType; label: string }> = [
  { value: '', label: 'Any room type' },
  { value: 'single', label: 'Single' },
  { value: 'double', label: 'Double' },
  { value: 'triple', label: 'Triple' },
  { value: 'bedsitter', label: 'Bedsitter' },
];

const samples = [
  {
    name: 'Maple Hall',
    meta: 'North campus · 428 beds',
    price: 'From KES 6,200',
    accent: 'bg-[#e9f1e6]',
    badge: 'Most popular',
  },
  {
    name: 'The Quad',
    meta: 'Main campus · 312 beds',
    price: 'From KES 8,500',
    accent: 'bg-[#ebe6df]',
    badge: 'Available now',
  },
  {
    name: 'Riverside House',
    meta: 'East campus · 196 beds',
    price: 'From KES 5,800',
    accent: 'bg-[#e3ecee]',
    badge: 'Available now',
  },
];

export function Landing() {
  const router = useRouter();
  const { user } = useAuth();
  const { rooms, loading, error } = useRooms({ limit: 50 });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hostelId, setHostelId] = useState('');
  const [roomType, setRoomType] = useState<'' | RoomType>('');
  const [search, setSearch] = useState('');

  const hostels = useMemo(() => {
    const seen = new Map<string, string>();
    for (const room of rooms) {
      seen.set(room.hostel.id, room.hostel.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const visibleRooms = rooms
    .filter((room) => (hostelId ? room.hostel.id === hostelId : true))
    .filter((room) => (roomType ? room.roomType === roomType : true))
    .filter((room) => {
      const haystack =
        `${room.hostel.name} ${room.hostel.location} ${room.roomNumber}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    })
    .slice(0, 6);

  const accountHref = !user ? '/login' : user.role === 'student' ? '/rooms' : '/admin';
  const available = rooms.filter((room) => room.availabilityStatus === 'available').length;

  function onSearch() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (hostelId) params.set('hostel', hostelId);
    if (roomType) params.set('type', roomType);
    const query = params.toString();
    router.push(query ? `/rooms?${query}` : '/rooms');
  }

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#1e2a29]">
      <nav className="sticky top-0 z-20 mx-auto flex max-w-7xl items-center justify-between border-b border-[#dedbd4]/70 bg-[#f5f3ef]/95 px-6 py-4 backdrop-blur-md lg:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="CampusStay home">
          <span className="grid size-9 place-items-center rounded-full bg-[#173d39] text-[#f8f4eb]">
            <BedDouble className="size-4" />
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.04em]">CampusStay</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-[#68726e] md:flex">
          <a href="#find-a-room" className="text-[#173d39]">
            Find a room
          </a>
          <a href="#how-it-works">How it works</a>
          <a href="#support">Support</a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {!user || user.role !== 'student' ? (
            <Link href="/admin" className="text-sm font-medium text-[#53605c]">
              Admin portal
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className="rounded-full bg-[#173d39] px-5 py-2 text-sm font-medium text-[#f8f4eb] hover:bg-[#285b55]"
          >
            {user ? 'Open dashboard' : 'Sign in'}
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </nav>
      {mobileOpen ? (
        <div className="border-y border-[#dedbd4] bg-[#f5f3ef] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4 text-sm font-medium">
            <a href="#find-a-room">Find a room</a>
            <a href="#how-it-works">How it works</a>
            <a href="#support">Support</a>
            <Link href="/admin">Admin portal</Link>
            <Link
              href={accountHref}
              className="rounded-full bg-[#173d39] px-5 py-2 text-center text-[#f8f4eb]"
            >
              {user ? 'Open dashboard' : 'Sign in'}
            </Link>
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="relative min-h-[510px] overflow-hidden rounded-[28px] bg-[#173d39] px-7 py-12 text-[#f8f4eb] sm:px-12 sm:py-16 lg:px-20 lg:py-20">
          <Image
            src="/images/campusstay-hero.png"
            alt="Students walking outside a university residence"
            fill
            priority
            className="object-cover opacity-55 mix-blend-luminosity"
            sizes="(min-width: 1280px) 1120px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#173d39] via-[#173d39]/85 to-transparent" />
          <div className="relative max-w-[570px]">
            <p className="mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b9d1c5]">
              <span className="size-1.5 rounded-full bg-[#d7ed82]" /> University housing, made
              simple
            </p>
            <h1 className="max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl">
              A better place to start your semester.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-[#d2ddd6]">
              Find a room that fits your budget, your routine, and the way you want to live on
              campus.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-[#e6efe8]">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[#d7ed82]" /> Verified rooms
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-4 text-[#d7ed82]" /> Secure M-Pesa payments
              </span>
            </div>
          </div>
          {!error ? (
            <div className="absolute bottom-7 right-7 hidden rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#c5d6cc]">
                Available today
              </p>
              <p className="mt-1 text-2xl font-medium">{loading ? '…' : `${available} rooms`}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section id="find-a-room" className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7e8984]">
              Your next room
            </p>
            <h2 className="text-3xl font-medium tracking-[-0.05em] text-[#173d39] sm:text-4xl">
              Find your fit.
            </h2>
          </div>
          <Link
            href="/rooms"
            className="hidden items-center gap-2 text-sm font-semibold text-[#40645d] sm:flex"
          >
            View all rooms <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mb-10 grid rounded-2xl border border-[#dcdad4] bg-[#fbfaf7] p-2 shadow-[0_12px_40px_rgba(32,55,48,0.06)] md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
          <label className="flex items-center gap-3 border-b border-[#e6e2da] px-4 py-3 md:border-b-0 md:border-r">
            <Search className="size-4 text-[#8b9790]" />
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9790]">
                Search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by hostel or area"
                className="bg-transparent text-sm outline-none placeholder:text-[#a9afaa]"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1 border-b border-[#e6e2da] px-4 py-3 md:border-b-0 md:border-r">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9790]">
              Hostel
            </span>
            <select
              value={hostelId}
              onChange={(event) => setHostelId(event.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="">Any hostel</option>
              {hostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b9790]">
              Room type
            </span>
            <select
              value={roomType}
              onChange={(event) => setRoomType(event.target.value as '' | RoomType)}
              className="bg-transparent text-sm outline-none"
            >
              {roomTypes.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <CampusButton
            className="h-12 w-full rounded-xl bg-[#d7ed82] px-7 font-semibold text-[#173d39] hover:bg-[#c9df70] md:w-auto"
            onClick={onSearch}
          >
            Search rooms
          </CampusButton>
        </div>
        {loading ? (
          <p className="text-sm text-[#7c8882]">Loading rooms…</p>
        ) : visibleRooms.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {visibleRooms.map((room, index) => (
              <RoomCard key={room.id} room={room} index={index} />
            ))}
          </div>
        ) : error ? (
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#7e8984]">
              Example residences
            </p>
            <div className="grid gap-5 md:grid-cols-3">
              {samples.map((item) => (
                <article
                  key={item.name}
                  className="overflow-hidden rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]"
                >
                  <div className={`relative h-48 ${item.accent}`}>
                    <Image
                      src="/images/campusstay-hero.png"
                      alt=""
                      fill
                      className="object-cover opacity-70 mix-blend-multiply"
                      sizes="400px"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-[#fbfaf7]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#54716a]">
                      {item.badge}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#173d39]">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#7f8b84]">{item.meta}</p>
                    <p className="mt-5 border-t border-[#ece9e2] pt-4 text-sm font-semibold text-[#40645d]">
                      {item.price}
                      <span className="font-normal text-[#99a29d]"> / month</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#7c8882]">No rooms match this search.</p>
        )}
        <div className="mt-10 flex flex-col gap-5 rounded-2xl border border-[#d8ded5] bg-[#e9f1e6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-[#173d39] text-[#d7ed82]">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#173d39]">A room you can trust</p>
              <p className="mt-0.5 text-xs text-[#5e746c]">
                Every listing is verified by your university housing team.
              </p>
            </div>
          </div>
          <div className="flex gap-5 text-xs font-semibold text-[#527166]">
            <span>Verified listings</span>
            <span>Secure payments</span>
            <span>Real-time availability</span>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-[#dedbd4] bg-[#ebe8e0] px-6 py-16 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7e8984]">
              Simple by design
            </p>
            <h2 className="max-w-sm text-3xl font-medium leading-tight tracking-[-0.05em] text-[#173d39]">
              From looking to living in three steps.
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            <Step
              number="01"
              title="Choose a room"
              text="Compare hostels, room types, prices, and what is still available."
            />
            <Step
              number="02"
              title="Reserve your spot"
              text="Send your request in a few clicks. No queues, no paperwork."
            />
            <Step
              number="03"
              title="Pay securely"
              text="Confirm your booking with a secure M-Pesa payment."
            />
          </div>
        </div>
      </section>
      <footer
        id="support"
        className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-[#7f8984] sm:flex-row sm:items-center sm:justify-between lg:px-10"
      >
        <span className="font-semibold text-[#173d39]">CampusStay</span>
        <span>University housing, without the runaround.</span>
        <span>Need help? housing@campusstay.ac.ke</span>
      </footer>
    </main>
  );
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="border-t border-[#c9c7c0] pt-4">
      <p className="text-xs font-bold text-[#658078]">{number}</p>
      <h3 className="mt-7 text-lg font-semibold tracking-[-0.03em] text-[#173d39]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#76817b]">{text}</p>
    </div>
  );
}
