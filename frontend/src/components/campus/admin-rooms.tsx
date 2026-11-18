'use client';

import { useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Cell,
  DataTable,
  EmptyState,
  Field,
  Modal,
  Notice,
  PageHeading,
  Pager,
  Row,
  SearchBox,
  StatusPill,
  dangerButtonClass,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import { formatKes, labelAvailability, labelRoomType } from '@/components/campus/format';
import { useAction, useApi } from '@/hooks/useApi';
import { apiRequest } from '@/lib/api';
import type { AvailabilityStatus, HostelSummary, Pagination, RoomSummary, RoomType } from '@/types';

const PAGE_SIZE = 20;
const roomTypes: RoomType[] = ['single', 'double', 'triple', 'bedsitter'];
const statuses: AvailabilityStatus[] = ['available', 'booked', 'maintenance'];

interface RoomList {
  rooms: Array<Omit<RoomSummary, 'hostel'> & { hostel: HostelSummary | null }>;
  pagination: Pagination;
}

type AdminRoom = RoomList['rooms'][number];

interface RoomDraft {
  hostelId: string;
  roomNumber: string;
  roomType: RoomType;
  price: string;
  capacity: string;
  availabilityStatus: AvailabilityStatus;
}

function draftFor(room: AdminRoom | null, hostels: HostelSummary[]): RoomDraft {
  return {
    hostelId: room?.hostel?.id ?? hostels[0]?.id ?? '',
    roomNumber: room?.roomNumber ?? '',
    roomType: room?.roomType ?? 'single',
    price: room ? String(room.price) : '',
    capacity: room ? String(room.capacity) : '1',
    availabilityStatus: room?.availabilityStatus ?? 'available',
  };
}

function draftProblem(draft: RoomDraft): string | null {
  if (!draft.hostelId) return 'Choose a hostel. Add one first if the list is empty.';
  if (!draft.roomNumber.trim()) return 'Enter a room number.';
  const price = Number(draft.price);
  if (draft.price === '' || !Number.isFinite(price) || price <= 0)
    return 'Enter a price above zero.';
  const capacity = Number(draft.capacity);
  if (!Number.isInteger(capacity) || capacity < 1)
    return 'Capacity must be a whole number of at least 1.';
  return null;
}

function RoomModal({
  room,
  hostels,
  onClose,
  onSaved,
}: {
  room: AdminRoom | null;
  hostels: HostelSummary[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState(() => draftFor(room, hostels));
  const { busy, error, run } = useAction();
  const problem = draftProblem(draft);

  function set<K extends keyof RoomDraft>(key: K, value: RoomDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (problem) return;
    const body = JSON.stringify({
      hostelId: draft.hostelId,
      roomNumber: draft.roomNumber.trim(),
      roomType: draft.roomType,
      price: Number(draft.price),
      capacity: Number(draft.capacity),
      availabilityStatus: draft.availabilityStatus,
    });
    const result = await run(() =>
      apiRequest<unknown>(room ? `/api/v1/admin/rooms/${room.id}` : '/api/v1/admin/rooms', {
        method: room ? 'PATCH' : 'POST',
        body,
      }),
    );
    if (result) onSaved(room ? 'Room updated.' : 'Room added.');
  }

  return (
    <Modal
      title={room ? `Edit ${room.roomNumber}` : 'Add a room'}
      description="Price is the booking fee students pay with M-Pesa."
      onClose={onClose}
    >
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field label="Hostel">
          <select
            className={fieldClass}
            value={draft.hostelId}
            onChange={(event) => set('hostelId', event.target.value)}
          >
            {hostels.length === 0 ? <option value="">No hostels yet</option> : null}
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room number">
            <input
              className={fieldClass}
              value={draft.roomNumber}
              onChange={(event) => set('roomNumber', event.target.value)}
            />
          </Field>
          <Field label="Type">
            <select
              className={fieldClass}
              value={draft.roomType}
              onChange={(event) => set('roomType', event.target.value as RoomType)}
            >
              {roomTypes.map((type) => (
                <option key={type} value={type}>
                  {labelRoomType(type)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (KES)">
            <input
              className={fieldClass}
              inputMode="numeric"
              value={draft.price}
              onChange={(event) => set('price', event.target.value)}
            />
          </Field>
          <Field label="Capacity">
            <input
              className={fieldClass}
              inputMode="numeric"
              value={draft.capacity}
              onChange={(event) => set('capacity', event.target.value)}
            />
          </Field>
        </div>
        <Field label="Availability">
          <select
            className={fieldClass}
            value={draft.availabilityStatus}
            onChange={(event) =>
              set('availabilityStatus', event.target.value as AvailabilityStatus)
            }
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {labelAvailability(status)}
              </option>
            ))}
          </select>
        </Field>
        {problem && draft.roomNumber ? <p className="text-xs text-[#a05d55]">{problem}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass} disabled={busy || Boolean(problem)}>
            {busy ? 'Saving…' : room ? 'Save room' : 'Add room'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function HostelModal({
  hostel,
  onClose,
  onSaved,
}: {
  hostel: HostelSummary | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(hostel?.name ?? '');
  const [location, setLocation] = useState(hostel?.location ?? '');
  const [phone, setPhone] = useState(hostel?.contactPhone ?? '');
  const { busy, error, run } = useAction();
  const valid =
    name.trim().length >= 2 &&
    location.trim().length >= 2 &&
    /^\+?[0-9]{10,15}$/.test(phone.trim());

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    const result = await run(() =>
      apiRequest<unknown>(hostel ? `/api/v1/admin/hostels/${hostel.id}` : '/api/v1/admin/hostels', {
        method: hostel ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          contactPhone: phone.trim(),
        }),
      }),
    );
    if (result) onSaved(hostel ? 'Hostel updated.' : 'Hostel added.');
  }

  return (
    <Modal title={hostel ? `Edit ${hostel.name}` : 'Add a hostel'} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Field label="Name">
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Location">
          <input
            className={fieldClass}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </Field>
        <Field label="Contact phone" hint="10 to 15 digits, a leading + is optional.">
          <input
            className={fieldClass}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass} disabled={busy || !valid}>
            {busy ? 'Saving…' : hostel ? 'Save hostel' : 'Add hostel'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminRooms() {
  const [page, setPage] = useState(1);
  const [hostelId, setHostelId] = useState('');
  const [roomType, setRoomType] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminRoom | 'new' | null>(null);
  const [hostelModal, setHostelModal] = useState<HostelSummary | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminRoom | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const deleteAction = useAction();

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (hostelId) params.set('hostelId', hostelId);
  if (roomType) params.set('roomType', roomType);
  if (status) params.set('availabilityStatus', status);

  const rooms = useApi<RoomList>(`/api/v1/admin/rooms?${params.toString()}`);
  const hostelList = useApi<{ hostels: HostelSummary[] }>('/api/v1/hostels');
  const hostels = hostelList.data?.hostels ?? [];
  const selectedHostel = hostels.find((hostel) => hostel.id === hostelId) ?? null;
  const reloadRooms = rooms.reload;
  const reloadHostels = hostelList.reload;

  const needle = query.trim().toLowerCase();
  const visible = (rooms.data?.rooms ?? []).filter((room) =>
    `${room.roomNumber} ${room.hostel?.name ?? ''} ${room.roomType}`.toLowerCase().includes(needle),
  );

  function filtered<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  async function confirmDelete() {
    if (!deleting) return;
    const result = await deleteAction.run(() =>
      apiRequest<unknown>(`/api/v1/admin/rooms/${deleting.id}`, { method: 'DELETE' }),
    );
    if (result) {
      setDeleting(null);
      setNotice(`Room ${deleting.roomNumber} deleted.`);
      reloadRooms();
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Inventory"
        title="Rooms"
        description="Add rooms, set the booking fee, and take rooms in and out of service."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => setHostelModal('new')}
            >
              <Building2 className="size-4" /> Add hostel
            </button>
            <button type="button" className={primaryButtonClass} onClick={() => setEditing('new')}>
              <Plus className="size-4" /> Add room
            </button>
          </div>
        }
      />
      <div className="flex flex-col gap-3 border-b border-[#dedbd4] py-5 lg:flex-row lg:items-center">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search this page by room or hostel"
        />
        <select
          aria-label="Filter by hostel"
          className={`${fieldClass} lg:w-48`}
          value={hostelId}
          onChange={(event) => filtered(setHostelId)(event.target.value)}
        >
          <option value="">All hostels</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          className={`${fieldClass} lg:w-40`}
          value={roomType}
          onChange={(event) => filtered(setRoomType)(event.target.value)}
        >
          <option value="">All types</option>
          {roomTypes.map((type) => (
            <option key={type} value={type}>
              {labelRoomType(type)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by availability"
          className={`${fieldClass} lg:w-44`}
          value={status}
          onChange={(event) => filtered(setStatus)(event.target.value)}
        >
          <option value="">Any availability</option>
          {statuses.map((value) => (
            <option key={value} value={value}>
              {labelAvailability(value)}
            </option>
          ))}
        </select>
        {selectedHostel ? (
          <button
            type="button"
            className={outlineButtonClass}
            onClick={() => setHostelModal(selectedHostel)}
          >
            <Pencil className="size-4" /> Edit hostel
          </button>
        ) : null}
      </div>
      <div className="mt-5 space-y-4">
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        {rooms.error ? <Notice tone="danger">{rooms.error}</Notice> : null}
        {rooms.loading && !rooms.data ? (
          <p className="text-sm text-[#7c8882]">Loading rooms…</p>
        ) : null}
        {rooms.data && visible.length === 0 ? (
          <EmptyState
            title="No rooms found"
            text="Adjust the filters, or add the first room for a hostel."
          />
        ) : null}
        {visible.length > 0 ? (
          <DataTable columns={['Room', 'Hostel', 'Type', 'Fee', 'Capacity', 'Status', '']}>
            {visible.map((room) => (
              <Row key={room.id}>
                <Cell strong>{room.roomNumber}</Cell>
                <Cell muted>{room.hostel?.name ?? 'Unknown'}</Cell>
                <Cell muted>{labelRoomType(room.roomType)}</Cell>
                <Cell>{formatKes(room.price)}</Cell>
                <Cell muted>{room.capacity}</Cell>
                <Cell>
                  <StatusPill
                    status={room.availabilityStatus}
                    label={labelAvailability(room.availabilityStatus)}
                  />
                </Cell>
                <Cell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      aria-label={`Edit room ${room.roomNumber}`}
                      className="rounded-lg p-2 text-[#68726e] hover:bg-black/5"
                      onClick={() => {
                        setNotice(null);
                        setEditing(room);
                      }}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete room ${room.roomNumber}`}
                      className="rounded-lg p-2 text-[#a05d55] hover:bg-[#f2e3e0]"
                      onClick={() => {
                        deleteAction.setError(null);
                        setDeleting(room);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </Cell>
              </Row>
            ))}
          </DataTable>
        ) : null}
        <Pager pagination={rooms.data?.pagination} onPage={setPage} />
      </div>
      {editing ? (
        <RoomModal
          room={editing === 'new' ? null : editing}
          hostels={hostels}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice(message);
            reloadRooms();
          }}
        />
      ) : null}
      {hostelModal ? (
        <HostelModal
          hostel={hostelModal === 'new' ? null : hostelModal}
          onClose={() => setHostelModal(null)}
          onSaved={(message) => {
            setHostelModal(null);
            setNotice(message);
            reloadHostels();
            reloadRooms();
          }}
        />
      ) : null}
      {deleting ? (
        <Modal
          title={`Delete room ${deleting.roomNumber}?`}
          description="This cannot be undone. Rooms with bookings cannot be deleted."
          onClose={() => setDeleting(null)}
        >
          {deleteAction.error ? <Notice tone="danger">{deleteAction.error}</Notice> : null}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={outlineButtonClass} onClick={() => setDeleting(null)}>
              Keep room
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={deleteAction.busy}
              onClick={() => void confirmDelete()}
            >
              {deleteAction.busy ? 'Deleting…' : 'Delete room'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
