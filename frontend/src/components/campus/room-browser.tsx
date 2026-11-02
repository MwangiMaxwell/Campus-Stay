'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { CampusButton } from '@/components/campus/campus-button';
import {
  formatKes,
  labelAvailability,
  labelRoomType,
  statusTone,
} from '@/components/campus/format';
import { useRooms } from '@/hooks/useRooms';
import type { RoomType } from '@/types';

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
        {loading ? 'Loading rooms…' : `${visible.length} of ${total} rooms`}
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
      {error ? <p className="mt-4 text-sm text-[#a05d55]">{error}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-[#ebe8e0] text-xs text-[#89948e]">
            <tr>
              <th className="px-5 py-4 font-medium">Room</th>
              <th className="px-5 py-4 font-medium">Hostel</th>
              <th className="px-5 py-4 font-medium">Type</th>
              <th className="px-5 py-4 font-medium">Price / month</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((room) => (
              <tr key={room.id} className="border-b border-[#f0ede7] last:border-0">
                <td className="px-5 py-4 font-semibold">{room.roomNumber}</td>
                <td className="px-5 py-4 text-[#74817a]">
                  {room.hostel.name}
                  <span className="mt-0.5 block text-xs">{room.hostel.location}</span>
                </td>
                <td className="px-5 py-4 text-[#74817a]">{labelRoomType(room.roomType)}</td>
                <td className="px-5 py-4 font-medium">{formatKes(room.price)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(labelAvailability(room.availabilityStatus))}`}
                  >
                    {labelAvailability(room.availabilityStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#7c8882]">No rooms match these filters.</p>
        ) : null}
      </div>
    </div>
  );
}
