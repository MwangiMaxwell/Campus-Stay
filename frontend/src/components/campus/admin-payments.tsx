'use client';

import { useState } from 'react';
import {
  Cell,
  DataTable,
  EmptyState,
  Metric,
  Notice,
  PageHeading,
  Pager,
  Row,
  SearchBox,
  StatusPill,
  Tabs,
} from '@/components/campus/campus-ui';
import { formatDateTime, formatKes } from '@/components/campus/format';
import { useApi } from '@/hooks/useApi';
import type { Dashboard, Pagination, Payment, PaymentStatus } from '@/types';

const PAGE_SIZE = 20;

interface PaymentList {
  payments: Payment[];
  pagination: Pagination;
}

type Filter = '' | PaymentStatus;

const tabs: Array<{ value: Filter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'success', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

export function AdminPayments() {
  const [filter, setFilter] = useState<Filter>('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (filter) params.set('status', filter);

  const payments = useApi<PaymentList>(`/api/v1/admin/payments?${params.toString()}`);
  const summary = useApi<{ dashboard: Dashboard }>('/api/v1/admin/dashboard');
  const totals = summary.data?.dashboard.payments;

  const needle = query.trim().toLowerCase();
  const visible = (payments.data?.payments ?? []).filter((payment) =>
    `${payment.booking?.user?.fullName ?? ''} ${payment.booking?.user?.email ?? ''} ${payment.mpesaReceiptNo ?? ''} ${payment.phoneNumber} ${payment.booking?.room?.roomNumber ?? ''}`
      .toLowerCase()
      .includes(needle),
  );

  return (
    <div>
      <PageHeading
        eyebrow="Finance"
        title="Payments"
        description="M-Pesa booking fees with the receipt number and the student who paid."
      />
      <div className="grid gap-4 py-7 sm:grid-cols-3">
        <Metric
          label="Collected this month"
          value={totals ? formatKes(totals.collectedThisMonth) : '…'}
          note={totals ? `${formatKes(totals.collectedTotal)} all time` : 'Loading'}
          up
        />
        <Metric
          label="Successful payments"
          value={totals ? String(totals.success) : '…'}
          note={totals ? `${totals.failed} failed` : 'Loading'}
          up
        />
        <Metric
          label="Awaiting confirmation"
          value={totals ? String(totals.pending) : '…'}
          note={totals && totals.pending > 0 ? 'Prompt sent to phone' : 'Queue is clear'}
          up={Boolean(totals) && totals?.pending === 0}
        />
      </div>
      <div className="flex flex-col gap-3 border-b border-[#dedbd4] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={filter}
          options={tabs}
          onChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
        />
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search this page by student or receipt"
        />
      </div>
      <div className="mt-5 space-y-4">
        {payments.error ? <Notice tone="danger">{payments.error}</Notice> : null}
        {payments.loading && !payments.data ? (
          <p className="text-sm text-[#7c8882]">Loading payments…</p>
        ) : null}
        {payments.data && visible.length === 0 ? (
          <EmptyState
            title="No transactions"
            text="A receipt appears after a student pays the booking fee."
          />
        ) : null}
        {visible.length > 0 ? (
          <DataTable
            minWidth={900}
            columns={['Date', 'Student', 'Room', 'Phone', 'Amount', 'Receipt', 'Status']}
          >
            {visible.map((payment) => (
              <Row key={payment.id}>
                <Cell muted>{formatDateTime(payment.paymentDate ?? payment.createdAt)}</Cell>
                <Cell>
                  <p className="font-semibold">{payment.booking?.user?.fullName ?? 'Unknown'}</p>
                  <p className="mt-0.5 text-xs text-[#8b9790]">{payment.booking?.user?.email}</p>
                </Cell>
                <Cell muted>
                  {payment.booking?.room?.hostel?.name} {payment.booking?.room?.roomNumber}
                </Cell>
                <Cell muted>{payment.phoneNumber}</Cell>
                <Cell strong>{formatKes(payment.amount)}</Cell>
                <Cell muted>{payment.mpesaReceiptNo ?? 'None'}</Cell>
                <Cell>
                  <StatusPill status={payment.status} />
                </Cell>
              </Row>
            ))}
          </DataTable>
        ) : null}
        <Pager pagination={payments.data?.pagination} onPage={setPage} />
      </div>
    </div>
  );
}
