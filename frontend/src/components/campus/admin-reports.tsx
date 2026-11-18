'use client';

import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  Cell,
  DataTable,
  EmptyState,
  Field,
  Notice,
  PageHeading,
  Row,
  StatusPill,
  Tabs,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import {
  capitalize,
  downloadCsv,
  formatDate,
  formatKes,
  labelRoomType,
} from '@/components/campus/format';
import { useApi } from '@/hooks/useApi';
import { apiRequest, formatApiError } from '@/lib/api';
import type { BookingStatus, HostelSummary, PaymentStatus, ReportHeader, RoomType } from '@/types';

type ReportKind = 'bookings' | 'payments' | 'occupancy';

interface BookingsReport extends ReportHeader {
  summary: {
    total: number;
    byStatus: Record<BookingStatus, number>;
    truncated: boolean;
  };
  rows: Array<{
    id: string;
    student: string;
    email: string;
    studentRegNo: string;
    hostel: string;
    roomNumber: string;
    roomType: string;
    fee: number;
    bookingDate: string;
    checkInDate: string;
    checkOutDate: string;
    status: BookingStatus;
    paymentStatus: string;
  }>;
}

interface PaymentsReport extends ReportHeader {
  summary: {
    total: number;
    totalCollected: number;
    byStatus: Record<PaymentStatus, { count: number; amount: number }>;
    truncated: boolean;
  };
  rows: Array<{
    id: string;
    date: string;
    student: string;
    studentRegNo: string;
    hostel: string;
    roomNumber: string;
    phoneNumber: string;
    amount: number;
    receipt: string;
    status: PaymentStatus;
  }>;
}

interface OccupancyReport extends ReportHeader {
  summary: {
    totalRooms: number;
    available: number;
    booked: number;
    maintenance: number;
    occupancyPercent: number;
  };
  rows: Array<{
    hostel: string;
    location: string;
    totalRooms: number;
    available: number;
    booked: number;
    maintenance: number;
    roomsWithStays: number;
    occupancyPercent: number;
  }>;
}

type AnyReport = BookingsReport | PaymentsReport | OccupancyReport;

const kinds: Array<{ value: ReportKind; label: string }> = [
  { value: 'bookings', label: 'Bookings' },
  { value: 'payments', label: 'Payments' },
  { value: 'occupancy', label: 'Occupancy' },
];

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AdminReports() {
  const [kind, setKind] = useState<ReportKind>('bookings');
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [hostelId, setHostelId] = useState('');
  const [report, setReport] = useState<AnyReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hostels = useApi<{ hostels: HostelSummary[] }>('/api/v1/hostels');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (kind !== 'occupancy' && status) params.set('status', status);
    if (kind !== 'payments' && hostelId) params.set('hostelId', hostelId);
    return params.toString();
  }, [from, to, status, hostelId, kind]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{ report: AnyReport }>(
        `/api/v1/admin/reports/${kind}${query ? `?${query}` : ''}`,
      );
      setReport(data.report);
    } catch (caught) {
      setError(formatApiError(caught));
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  function printReport() {
    window.print();
  }

  function exportCsv() {
    if (!report) return;
    if (kind === 'bookings' && 'rows' in report && report.rows[0] && 'fee' in report.rows[0]) {
      const rows = (report as BookingsReport).rows;
      downloadCsv(
        'campusstay-bookings.csv',
        [
          'Student',
          'Email',
          'Reg no',
          'Hostel',
          'Room',
          'Type',
          'Fee',
          'Booked',
          'Check-in',
          'Check-out',
          'Status',
          'Payment',
        ],
        rows.map((row) => [
          row.student,
          row.email,
          row.studentRegNo,
          row.hostel,
          row.roomNumber,
          row.roomType,
          row.fee,
          formatDate(row.bookingDate),
          formatDate(row.checkInDate),
          formatDate(row.checkOutDate),
          row.status,
          row.paymentStatus,
        ]),
      );
      return;
    }
    if (kind === 'payments' && 'totalCollected' in report.summary) {
      const rows = (report as PaymentsReport).rows;
      downloadCsv(
        'campusstay-payments.csv',
        ['Date', 'Student', 'Reg no', 'Hostel', 'Room', 'Phone', 'Amount', 'Receipt', 'Status'],
        rows.map((row) => [
          formatDate(row.date),
          row.student,
          row.studentRegNo,
          row.hostel,
          row.roomNumber,
          row.phoneNumber,
          row.amount,
          row.receipt,
          row.status,
        ]),
      );
      return;
    }
    const rows = (report as OccupancyReport).rows;
    downloadCsv(
      'campusstay-occupancy.csv',
      [
        'Hostel',
        'Location',
        'Total rooms',
        'Available',
        'Booked',
        'Maintenance',
        'Rooms with stays',
        'Occupancy %',
      ],
      rows.map((row) => [
        row.hostel,
        row.location,
        row.totalRooms,
        row.available,
        row.booked,
        row.maintenance,
        row.roomsWithStays,
        row.occupancyPercent,
      ]),
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Insights"
        title="Reports"
        description="Filterable bookings, payments, and occupancy reports with the organization name and logo for printing."
        action={
          report ? (
            <div className="flex gap-2 print:hidden">
              <button type="button" className={outlineButtonClass} onClick={exportCsv}>
                <Download className="size-4" /> CSV
              </button>
              <button type="button" className={primaryButtonClass} onClick={printReport}>
                <Printer className="size-4" /> Print
              </button>
            </div>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-4 print:hidden">
        <Tabs
          value={kind}
          options={kinds}
          onChange={(value) => {
            setKind(value);
            setStatus('');
            setReport(null);
          }}
        />
        <div className="grid gap-4 rounded-2xl border border-[#dedbd4] bg-[#fbfaf7] p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="From">
            <input
              type="date"
              className={fieldClass}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              className={fieldClass}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </Field>
          {kind !== 'occupancy' ? (
            <Field label="Status">
              <select
                className={fieldClass}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Any status</option>
                {kind === 'bookings' ? (
                  <>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </>
                )}
              </select>
            </Field>
          ) : null}
          {kind !== 'payments' ? (
            <Field label="Hostel">
              <select
                className={fieldClass}
                value={hostelId}
                onChange={(event) => setHostelId(event.target.value)}
              >
                <option value="">All hostels</option>
                {(hostels.data?.hostels ?? []).map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
        <button
          type="button"
          className={primaryButtonClass}
          disabled={busy}
          onClick={() => void generate()}
        >
          {busy ? 'Generating…' : 'Generate report'}
        </button>
        {error ? <Notice tone="danger">{error}</Notice> : null}
      </div>

      {report ? (
        <div className="mt-8 space-y-6">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dedbd4] pb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7e8984]">
                {report.organization.name}
              </p>
              <h3 className="mt-2 text-2xl font-medium tracking-[-0.04em]">{report.title}</h3>
              <p className="mt-1 text-xs text-[#8b9790]">
                Generated {formatDate(report.generatedAt)}
                {from || to ? ` · ${from || '…'} to ${to || '…'}` : ''}
              </p>
            </div>
            {report.organization.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={report.organization.logoUrl}
                alt={`${report.organization.name} logo`}
                className="h-12 w-auto object-contain"
              />
            ) : null}
          </header>

          {kind === 'bookings' &&
          'byStatus' in report.summary &&
          !('totalCollected' in report.summary) ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                {Object.entries((report as BookingsReport).summary.byStatus).map(([key, count]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3"
                  >
                    <p className="text-xs text-[#8b9790]">{capitalize(key)}</p>
                    <p className="mt-1 text-xl font-medium">{count}</p>
                  </div>
                ))}
              </div>
              {(report as BookingsReport).rows.length === 0 ? (
                <EmptyState
                  title="No bookings in this range"
                  text="Widen the dates or clear a filter."
                />
              ) : (
                <DataTable
                  columns={['Student', 'Hostel / room', 'Stay', 'Fee', 'Status', 'Payment']}
                >
                  {(report as BookingsReport).rows.map((row) => (
                    <Row key={row.id}>
                      <Cell>
                        <p className="font-medium">{row.student}</p>
                        <p className="text-xs text-[#8b9790]">{row.email}</p>
                      </Cell>
                      <Cell>
                        {row.hostel} {row.roomNumber}
                        <p className="text-xs text-[#8b9790]">
                          {row.roomType ? labelRoomType(row.roomType as RoomType) : ''}
                        </p>
                      </Cell>
                      <Cell muted>
                        {formatDate(row.checkInDate)} to {formatDate(row.checkOutDate)}
                      </Cell>
                      <Cell strong>{formatKes(row.fee)}</Cell>
                      <Cell>
                        <StatusPill status={row.status} />
                      </Cell>
                      <Cell>
                        <StatusPill status={row.paymentStatus} />
                      </Cell>
                    </Row>
                  ))}
                </DataTable>
              )}
            </>
          ) : null}

          {kind === 'payments' && 'totalCollected' in report.summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3">
                  <p className="text-xs text-[#8b9790]">Collected</p>
                  <p className="mt-1 text-xl font-medium">
                    {formatKes((report as PaymentsReport).summary.totalCollected)}
                  </p>
                </div>
                {Object.entries((report as PaymentsReport).summary.byStatus).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3"
                  >
                    <p className="text-xs text-[#8b9790]">{capitalize(key)}</p>
                    <p className="mt-1 text-xl font-medium">{value.count}</p>
                    <p className="text-xs text-[#8b9790]">{formatKes(value.amount)}</p>
                  </div>
                ))}
              </div>
              {(report as PaymentsReport).rows.length === 0 ? (
                <EmptyState
                  title="No payments in this range"
                  text="Widen the dates or clear a filter."
                />
              ) : (
                <DataTable
                  columns={[
                    'Date',
                    'Student',
                    'Hostel / room',
                    'Phone',
                    'Amount',
                    'Receipt',
                    'Status',
                  ]}
                >
                  {(report as PaymentsReport).rows.map((row) => (
                    <Row key={row.id}>
                      <Cell muted>{formatDate(row.date)}</Cell>
                      <Cell>
                        <p className="font-medium">{row.student}</p>
                        <p className="text-xs text-[#8b9790]">{row.studentRegNo}</p>
                      </Cell>
                      <Cell>
                        {row.hostel} {row.roomNumber}
                      </Cell>
                      <Cell muted>{row.phoneNumber}</Cell>
                      <Cell strong>{formatKes(row.amount)}</Cell>
                      <Cell muted>{row.receipt || '—'}</Cell>
                      <Cell>
                        <StatusPill status={row.status} />
                      </Cell>
                    </Row>
                  ))}
                </DataTable>
              )}
            </>
          ) : null}

          {kind === 'occupancy' &&
          'occupancyPercent' in report.summary &&
          !('byStatus' in report.summary) ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3">
                  <p className="text-xs text-[#8b9790]">Occupancy</p>
                  <p className="mt-1 text-xl font-medium">
                    {(report as OccupancyReport).summary.occupancyPercent}%
                  </p>
                </div>
                <div className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3">
                  <p className="text-xs text-[#8b9790]">Available</p>
                  <p className="mt-1 text-xl font-medium">
                    {(report as OccupancyReport).summary.available}
                  </p>
                </div>
                <div className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3">
                  <p className="text-xs text-[#8b9790]">Booked</p>
                  <p className="mt-1 text-xl font-medium">
                    {(report as OccupancyReport).summary.booked}
                  </p>
                </div>
                <div className="rounded-xl border border-[#dedbd4] bg-[#fbfaf7] px-4 py-3">
                  <p className="text-xs text-[#8b9790]">Maintenance</p>
                  <p className="mt-1 text-xl font-medium">
                    {(report as OccupancyReport).summary.maintenance}
                  </p>
                </div>
              </div>
              {(report as OccupancyReport).rows.length === 0 ? (
                <EmptyState
                  title="No hostel data"
                  text="Add rooms first, then run this report again."
                />
              ) : (
                <DataTable
                  columns={[
                    'Hostel',
                    'Total',
                    'Available',
                    'Booked',
                    'Maintenance',
                    'Stays in period',
                    'Occupancy',
                  ]}
                >
                  {(report as OccupancyReport).rows.map((row) => (
                    <Row key={row.hostel}>
                      <Cell>
                        <p className="font-medium">{row.hostel}</p>
                        <p className="text-xs text-[#8b9790]">{row.location}</p>
                      </Cell>
                      <Cell>{row.totalRooms}</Cell>
                      <Cell>{row.available}</Cell>
                      <Cell>{row.booked}</Cell>
                      <Cell>{row.maintenance}</Cell>
                      <Cell>{row.roomsWithStays}</Cell>
                      <Cell strong>{row.occupancyPercent}%</Cell>
                    </Row>
                  ))}
                </DataTable>
              )}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
