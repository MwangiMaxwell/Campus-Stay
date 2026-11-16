'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Search, ShieldCheck } from 'lucide-react';
import { CampusButton } from '@/components/campus/campus-button';
import { labelRoomType } from '@/components/campus/format';
import { RoomCard } from '@/components/campus/room-card';
import { useRooms } from '@/hooks/useRooms';
import type { RoomType } from '@/types';

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

const roomTypes: Array<'' | RoomType> = ['', 'single', 'double', 'triple', 'bedsitter'];

function isRoomType(value: string | null): value is RoomType {
  return value === 'single' || value === 'double' || value === 'triple' || value === 'bedsitter';
}

export function RoomBrowser() {
  const params = useSearchParams();
  const initialType = params.get('type');
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [hostelId, setHostelId] = useState(params.get('hostel') ?? '');
  const [roomType, setRoomType] = useState<'' | RoomType>(
    isRoomType(initialType) ? initialType : '',
  );
  const [availableOnly, setAvailableOnly] = useState(false);
  const { rooms, loading, error, total } = useRooms({
    roomType: roomType || undefined,
    available: availableOnly ? 'true' : undefined,
    limit: 50,
  });

  const hostels = useMemo(() => {
    const seen = new Map<string, string>();
    for (const room of rooms) {
      seen.set(room.hostel.id, room.hostel.name);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [rooms]);

  const visible = rooms.filter((room) => {
    if (hostelId && room.hostel.id !== hostelId) return false;
    const haystack = `${room.roomNumber} ${room.hostel.name} ${room.hostel.location}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">
        Your next room
      </p>
      <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em]">Find your fit.</h2>
      <p className="mt-2 text-sm text-[#7c8882]">
        {loading
          ? 'Loading rooms…'
          : error
            ? 'Showing example residences while the room list is offline.'
            : `${visible.length} of ${total} rooms`}
      </p>
      <div className="mt-8 grid rounded-2xl border border-[#dcdad4] bg-[#fbfaf7] p-2 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
        <label className="flex items-center gap-3 border-b border-[#e6e2da] px-4 py-3 md:border-b-0 md:border-r">
          <Search className="size-4 text-[#8b9790]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by hostel or area"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[#a9afaa]"
          />
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
            {roomTypes.map((type) => (
              <option key={type || 'any'} value={type}>
                {type ? labelRoomType(type) : 'Any room type'}
              </option>
            ))}
          </select>
        </label>
        <CampusButton
          className="h-12 rounded-xl bg-[#d7ed82] px-7 font-semibold text-[#173d39]"
          onClick={() => setAvailableOnly((value) => !value)}
        >
          {availableOnly ? 'Showing open rooms' : 'Available only'}
        </CampusButton>
      </div>
      {loading ? <p className="mt-8 text-sm text-[#7c8882]">Loading rooms…</p> : null}
      {!loading && visible.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((room, index) => (
            <RoomCard key={room.id} room={room} index={index} />
          ))}
        </div>
      ) : null}
      {!loading && visible.length === 0 && error ? (
        <div className="mt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#7e8984]">
            Example residences
          </p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {samples.map((item) => (
              <article
                key={item.name}
                className="overflow-hidden rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]"
              >
                <div className={`relative h-48 overflow-hidden ${item.accent}`}>
                  <Image
                    src="/images/campusstay-hero.png"
                    alt=""
                    fill
                    className="object-cover opacity-70 mix-blend-multiply"
                    sizes="(min-width: 768px) 33vw, 100vw"
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
      ) : null}
      {!loading && visible.length === 0 && !error ? (
        <p className="mt-8 text-sm text-[#7c8882]">No rooms match these filters.</p>
      ) : null}
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
    </div>
  );
}
