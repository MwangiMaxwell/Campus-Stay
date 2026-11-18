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

export function capitalize(value: string): string {
  const text = value.replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Colours for status pills. Accepts any casing so API values can be passed straight in.
export function statusTone(label: string): string {
  const key = label.toLowerCase();
  if (['available', 'completed', 'approved', 'active', 'success', 'paid'].includes(key)) {
    return 'bg-[#e9f1e6] text-[#467065]';
  }
  if (['pending', 'reserved', 'occupied', 'booked', 'unpaid'].includes(key)) {
    return 'bg-[#fff1d9] text-[#9b6c39]';
  }
  return 'bg-[#f2e3e0] text-[#a05d55]';
}

// Stay dates are stored at UTC midnight, so format them in UTC to avoid off-by-one days.
export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// YYYY-MM-DD for date inputs, counted in UTC to match how the server checks dates.
export function dateInputValue(offsetDays = 0, from = new Date()): string {
  const date = new Date(from.getTime());
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function addDays(dateInput: string, days: number): string {
  return dateInputValue(days, new Date(`${dateInput}T00:00:00.000Z`));
}

function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function downloadCsv(filename: string, header: string[], rows: unknown[][]): void {
  const body = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${body}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
