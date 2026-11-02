import type { AvailabilityStatus, RoomType } from '@/types';

const roomTypeLabels: Record<RoomType, string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  bedsitter: 'Bedsitter',
};

const availabilityLabels: Record<AvailabilityStatus, string> = {
  available: 'Available',
  booked: 'Occupied',
  maintenance: 'Maintenance',
};

export function formatKes(amount: number): string {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function labelRoomType(type: RoomType): string {
  return roomTypeLabels[type];
}

export function labelAvailability(status: AvailabilityStatus): string {
  return availabilityLabels[status];
}

export function statusTone(label: string): string {
  if (
    label === 'Available' ||
    label === 'Completed' ||
    label === 'Approved' ||
    label === 'active'
  ) {
    return 'bg-[#e9f1e6] text-[#467065]';
  }
  if (label === 'Pending' || label === 'Reserved' || label === 'Occupied') {
    return 'bg-[#fff1d9] text-[#9b6c39]';
  }
  return 'bg-[#f2e3e0] text-[#a05d55]';
}
