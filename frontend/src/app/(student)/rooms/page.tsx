import { Suspense } from 'react';
import { RoomBrowser } from '@/components/campus/room-browser';

export default function RoomsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-[#7c8882]">Loading rooms…</p>}>
      <RoomBrowser />
    </Suspense>
  );
}
