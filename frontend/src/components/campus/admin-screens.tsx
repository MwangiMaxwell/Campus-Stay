'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BedDouble,
  Building2,
  ChevronRight,
  ClipboardList,
  Receipt,
  Search,
} from 'lucide-react';
import { CampusButton } from '@/components/campus/campus-button';
import {
  formatKes,
  labelAvailability,
  labelRoomType,
  statusTone,
} from '@/components/campus/format';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';

export function AdminOverview() {
  const { rooms, loading, error, total } = useRooms({ limit: 50 });
  const available = rooms.filter((room) => room.availabilityStatus === 'available').length;
  const taken = rooms.length - available;
  const occupancy = rooms.length === 0 ? null : Math.round((taken / rooms.length) * 100);
  const byHostel = useMemo(() => {
    const grouped = new Map<string, { name: string; total: number; taken: number }>();
    for (const room of rooms) {
      const current = grouped.get(room.hostel.id) ?? { name: room.hostel.name, total: 0, taken: 0 };
      current.total += 1;
      if (room.availabilityStatus !== 'available') current.taken += 1;
      grouped.set(room.hostel.id, current);
    }
    return [...grouped.values()];
  }, [rooms]);

  return (
    <div>
      <PageHeading
        eyebrow="Operations overview"
        title="Keep campus moving."
        description="Room totals come from the housing list. Bookings and payments appear here once those services are recording."
        action={
          <Link
            href="/admin/rooms"
            className="inline-flex items-center gap-2 rounded-xl bg-[#173d39] px-4 py-2 text-sm font-medium text-[#f8f4eb] hover:bg-[#285b55]"
          >
            Manage rooms <ChevronRight className="size-4" />
          </Link>
        }
      />
      <div className="grid gap-4 py-7 sm:grid-cols-3">
        <Metric
          label="Rooms listed"
          value={loading ? '…' : error ? '—' : String(total)}
          note={error ? 'List unreachable' : 'Live'}
          up={!error}
        />
        <Metric
          label="Available now"
          value={loading ? '…' : error ? '—' : String(available)}
          note={error ? 'Waiting on the list' : 'Open to book'}
          up={!error && available > 0}
        />
        <Metric
          label="Occupancy"
          value={occupancy === null ? '—' : `${occupancy}%`}
          note={occupancy === null ? 'No rooms loaded' : `${taken} not available`}
          up={occupancy !== null && occupancy < 90}
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">Booking activity</h3>
              <p className="mt-1 text-xs text-[#8a948e]">Reservations across all hostels</p>
            </div>
          </div>
          <div className="mt-10 flex h-48 items-end">
            <p className="max-w-sm text-sm leading-6 text-[#7c8882]">
              The monthly chart fills in after students start reserving rooms.
            </p>
          </div>
        </section>
        <section className="rounded-2xl border border-[#dedbd4] bg-[#173d39] p-6 text-[#f8f4eb]">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">By hostel</h3>
            <BarChart3 className="size-4 text-[#b9d1c5]" />
          </div>
          <div className="mt-8 flex flex-col gap-6">
            {byHostel.length > 0 ? (
              byHostel.map((hostel) => {
                const percent = Math.round((hostel.taken / hostel.total) * 100);
                return (
                  <Progress
                    key={hostel.name}
                    label={hostel.name}
                    value={`${percent}%`}
                    width={`${percent}%`}
                  />
                );
              })
            ) : (
              <p className="text-sm leading-6 text-[#c6d3cb]">
                Hostel occupancy shows once the room list loads.
              </p>
            )}
          </div>
          <Link
            href="/admin/rooms"
            className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#d7ed82]"
          >
            View room inventory <ArrowUpRight className="size-3" />
          </Link>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Needs your attention</h3>
            <p className="mt-1 text-xs text-[#8a948e]">
              Jump to the queue you want to work through
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Action
            icon={<ClipboardList className="size-4" />}
            title="Bookings"
            text="Approval queue"
            href="/admin/bookings"
          />
          <Action
            icon={<BedDouble className="size-4" />}
            title="Rooms"
            text="Live room list"
            href="/admin/rooms"
          />
          <Action
            icon={<Receipt className="size-4" />}
            title="Payments"
            text="M-Pesa ledger"
            href="/admin/payments"
          />
        </div>
      </section>
    </div>
  );
}

export function AdminRooms() {
  const [query, setQuery] = useState('');
  const { rooms, loading, error } = useRooms({ limit: 50 });
  const filtered = useMemo(
    () =>
      rooms.filter((room) =>
        `${room.roomNumber} ${room.hostel.name} ${room.roomType}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [rooms, query],
  );

  return (
    <div>
      <PageHeading
        eyebrow="Inventory"
        title="Rooms"
        description="Room details, pricing, and availability from the housing list."
        action={
          <CampusButton
            variant="outline"
            className="rounded-xl border-[#cbc9c2] px-4 py-2"
            disabled
          >
            <Building2 className="size-4" /> Add room
          </CampusButton>
        }
      />
      <DataToolbar placeholder="Search rooms or hostels" query={query} setQuery={setQuery} />
      {error ? <p className="mt-4 text-sm text-[#a05d55]">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-[#7c8882]">Loading rooms…</p> : null}
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#ebe8e0] text-xs text-[#89948e]">
            <tr>
              <th className="px-5 py-4 font-medium">Room</th>
              <th className="px-5 py-4 font-medium">Hostel</th>
              <th className="px-5 py-4 font-medium">Type</th>
              <th className="px-5 py-4 font-medium">Price / month</th>
              <th className="px-5 py-4 font-medium">Capacity</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((room) => (
              <tr key={room.id} className="border-b border-[#f0ede7] last:border-0">
                <td className="px-5 py-4 font-semibold">{room.roomNumber}</td>
                <td className="px-5 py-4 text-[#74817a]">{room.hostel.name}</td>
                <td className="px-5 py-4 text-[#74817a]">{labelRoomType(room.roomType)}</td>
                <td className="px-5 py-4 font-medium">{formatKes(room.price)}</td>
                <td className="px-5 py-4 text-[#74817a]">{room.capacity}</td>
                <td className="px-5 py-4">
                  <Status>{labelAvailability(room.availabilityStatus)}</Status>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#7c8882]">No rooms match this search.</p>
        ) : null}
      </div>
    </div>
  );
}

export function AdminBookings() {
  return (
    <div>
      <PageHeading
        eyebrow="Reservations"
        title="Bookings"
        description="Approve or cancel a request from this queue once booking is recording."
      />
      <DataToolbar placeholder="Search by student or room" />
      <EmptyLedger
        title="No booking requests"
        text="New reservations will line up here with the student, room, and fee."
      />
    </div>
  );
}

export function AdminPayments() {
  return (
    <div>
      <PageHeading
        eyebrow="Finance"
        title="Payments"
        description="M-Pesa booking fees land in this ledger with the receipt number."
      />
      <div className="grid gap-4 py-7 sm:grid-cols-3">
        <Metric label="Collected this month" value="—" note="No receipts yet" />
        <Metric label="Successful payments" value="0" note="Nothing recorded" />
        <Metric label="Awaiting confirmation" value="0" note="Queue is clear" up />
      </div>
      <EmptyLedger
        title="No transactions"
        text="A receipt appears after a student pays the booking fee."
      />
    </div>
  );
}

export function AdminUsers() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeading
        eyebrow="People"
        title="Students and staff"
        description="Only a super admin can assign staff roles. The directory lists the signed-in account until user administration is connected."
      />
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[#dedbd4] bg-[#fbfaf7]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#ebe8e0] text-xs text-[#89948e]">
            <tr>
              <th className="px-5 py-4 font-medium">Name</th>
              <th className="px-5 py-4 font-medium">Email</th>
              <th className="px-5 py-4 font-medium">Phone</th>
              <th className="px-5 py-4 font-medium">Role</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {user ? (
              <tr>
                <td className="px-5 py-4 font-semibold">{user.fullName}</td>
                <td className="px-5 py-4 text-[#74817a]">{user.email}</td>
                <td className="px-5 py-4 text-[#74817a]">{user.phone}</td>
                <td className="px-5 py-4 text-[#74817a]">{user.role.replace('_', ' ')}</td>
                <td className="px-5 py-4">
                  <Status>{user.status}</Status>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminReports() {
  return (
    <div>
      <PageHeading
        eyebrow="Reports"
        title="Bookings, payments, and occupancy"
        description="Filter the report you want to print. The figures fill in when the report service is connected."
      />
      <div className="mt-6 grid gap-4 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b9790]">
          From
          <input
            type="date"
            className="rounded-xl border border-[#d8d5ce] bg-transparent px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#173d39]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b9790]">
          To
          <input
            type="date"
            className="rounded-xl border border-[#d8d5ce] bg-transparent px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#173d39]"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8b9790]">
          Report
          <select className="rounded-xl border border-[#d8d5ce] bg-transparent px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#173d39]">
            <option>Bookings</option>
            <option>Payments</option>
            <option>Occupancy</option>
          </select>
        </label>
      </div>
      <article className="mt-5 rounded-2xl border border-dashed border-[#d4d1ca] bg-[#fbfaf7] px-6 py-12 text-center">
        <p className="text-sm font-semibold">Nothing to print yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#7c8882]">
          The date, organization name, and logo will head the report when the figures are ready.
        </p>
      </article>
    </div>
  );
}

function EmptyLedger({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] px-6 py-14 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#7c8882]">{text}</p>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#dedbd4] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-4xl font-medium tracking-[-0.06em] text-[#173d39]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#7c8882]">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  up,
}: {
  label: string;
  value: string;
  note: string;
  up?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-5">
      <p className="text-xs text-[#82908a]">{label}</p>
      <p className="mt-5 text-3xl font-medium tracking-[-0.05em]">{value}</p>
      <p
        className={`mt-2 flex items-center gap-1 text-xs font-semibold ${up ? 'text-[#5f8176]' : 'text-[#b27b4b]'}`}
      >
        {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
        {note}
      </p>
    </div>
  );
}

function Progress({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-[#c5d6cc]">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/15">
        <div style={{ width }} className="h-full rounded-full bg-[#d7ed82]" />
      </div>
    </div>
  );
}

function Action({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[#ebe8e0] p-3 text-left transition hover:border-[#b9d1c5] hover:bg-[#f5f3ef]"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-[#e9f1e6] text-[#467065]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-[#89948e]">{text}</span>
      </span>
      <ChevronRight className="ml-auto size-4 text-[#a6afa9]" />
    </Link>
  );
}

function DataToolbar({
  placeholder,
  query = '',
  setQuery,
}: {
  placeholder: string;
  query?: string;
  setQuery?: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dedbd4] py-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 rounded-xl border border-[#d8d5ce] bg-[#fbfaf7] px-3 py-2.5 sm:w-80">
        <Search className="size-4 text-[#96a19b]" />
        <input
          value={query}
          onChange={(event) => setQuery?.(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#a1aaa5]"
        />
      </div>
    </div>
  );
}

function Status({ children }: { children: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone(children)}`}>
      {children}
    </span>
  );
}
