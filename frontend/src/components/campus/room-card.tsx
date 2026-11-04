import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { formatKes, labelRoomType } from '@/components/campus/format';
import type { RoomSummary } from '@/types';

const accents = ['bg-[#e9f1e6]', 'bg-[#ebe6df]', 'bg-[#e3ecee]'];

export function RoomCard({ room, index = 0 }: { room: RoomSummary; index?: number }) {
  const badge =
    room.availabilityStatus === 'available'
      ? 'Available now'
      : room.availabilityStatus === 'booked'
        ? 'Booked'
        : 'Maintenance';

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] transition duration-300 hover:-translate-y-1 hover:border-[#b8c9bc] hover:shadow-[0_18px_45px_rgba(32,55,48,0.1)]">
      <div className={`relative h-48 overflow-hidden ${accents[index % accents.length]}`}>
        <Image
          src="/images/campusstay-hero.png"
          alt={`${room.hostel.name} ${room.roomNumber}`}
          fill
          className="object-cover opacity-70 mix-blend-multiply transition duration-500 group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-[#fbfaf7]/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#54716a]">
          {badge}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#173d39]">
              {room.hostel.name} {room.roomNumber}
            </h3>
            <p className="mt-1 text-xs text-[#7f8b84]">
              {room.hostel.location} · {labelRoomType(room.roomType)} · sleeps {room.capacity}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-[#84938b] transition-transform group-hover:translate-x-1" />
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[#ece9e2] pt-4">
          <p className="text-sm font-semibold text-[#40645d]">
            {formatKes(room.price)}
            <span className="font-normal text-[#99a29d]"> / month</span>
          </p>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#96a19b]">
            {labelRoomType(room.roomType)}
          </span>
        </div>
      </div>
    </article>
  );
}
