'use client';

import { useState } from 'react';
import { Pencil, Plus, UserX } from 'lucide-react';
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
  Tabs,
  dangerButtonClass,
  fieldClass,
  outlineButtonClass,
  primaryButtonClass,
} from '@/components/campus/campus-ui';
import { capitalize } from '@/components/campus/format';
import { useAction, useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api';
import type { Pagination, PublicUser, UserRole, UserStatus } from '@/types';

const PAGE_SIZE = 20;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

interface UserList {
  users: PublicUser[];
  pagination: Pagination;
}

type RoleFilter = '' | UserRole;
type StatusFilter = '' | UserStatus;

interface UserDraft {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  studentRegNo: string;
}

function blankDraft(role: UserRole): UserDraft {
  return {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role,
    status: 'active',
    studentRegNo: '',
  };
}

function draftFrom(user: PublicUser): UserDraft {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    password: '',
    role: user.role,
    status: user.status,
    studentRegNo: user.studentRegNo ?? '',
  };
}

function draftProblem(draft: UserDraft, editing: boolean): string | null {
  if (draft.fullName.trim().length < 2) return 'Enter the full name.';
  if (!draft.email.includes('@')) return 'Enter a valid email address.';
  if (!PHONE_PATTERN.test(draft.phone.trim())) {
    return 'Enter a phone number with 10 to 15 digits. A leading + is optional.';
  }
  if (!editing && draft.password.length < 8) {
    return 'Password must be at least 8 characters with a letter and a number.';
  }
  if (
    draft.password &&
    (draft.password.length < 8 || !/[A-Za-z]/.test(draft.password) || !/[0-9]/.test(draft.password))
  ) {
    return 'Password must be at least 8 characters with a letter and a number.';
  }
  if (
    draft.role === 'student' &&
    draft.studentRegNo.trim() &&
    draft.studentRegNo.trim().length < 2
  ) {
    return 'Registration number must be at least 2 characters, or leave it blank.';
  }
  return null;
}

function UserModal({
  user,
  canManageStaff,
  onClose,
  onSaved,
}: {
  user: PublicUser | null;
  canManageStaff: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const defaultRole: UserRole = 'student';
  const [draft, setDraft] = useState(() => (user ? draftFrom(user) : blankDraft(defaultRole)));
  const { busy, error, run } = useAction();
  const problem = draftProblem(draft, Boolean(user));
  const roleOptions: UserRole[] = canManageStaff
    ? ['student', 'admin', 'super_admin']
    : ['student'];

  function set<K extends keyof UserDraft>(key: K, value: UserDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (problem) return;

    const body: Record<string, unknown> = {
      fullName: draft.fullName.trim(),
      email: draft.email.trim().toLowerCase(),
      phone: draft.phone.trim(),
      role: draft.role,
      status: draft.status,
    };
    if (draft.role === 'student') {
      const reg = draft.studentRegNo.trim();
      if (reg) body.studentRegNo = reg;
    }
    if (draft.password) body.password = draft.password;
    if (!user) body.password = draft.password;

    const result = await run(() =>
      apiRequest<{ user: PublicUser }>(
        user ? `/api/v1/admin/users/${user.id}` : '/api/v1/admin/users',
        {
          method: user ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        },
      ),
    );
    if (result) {
      onSaved(user ? `Updated ${result.user.fullName}.` : `Created ${result.user.fullName}.`);
      onClose();
    }
  }

  return (
    <Modal title={user ? 'Edit account' : 'Add account'} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
        {error ? <Notice tone="danger">{error}</Notice> : null}
        {problem ? <Notice tone="info">{problem}</Notice> : null}
        <Field label="Full name">
          <input
            className={fieldClass}
            value={draft.fullName}
            onChange={(event) => set('fullName', event.target.value)}
            autoComplete="name"
          />
        </Field>
        <Field label="Email">
          <input
            className={fieldClass}
            type="email"
            value={draft.email}
            onChange={(event) => set('email', event.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone">
          <input
            className={fieldClass}
            value={draft.phone}
            onChange={(event) => set('phone', event.target.value)}
            placeholder="+2547..."
            autoComplete="tel"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role">
            <select
              className={fieldClass}
              value={draft.role}
              onChange={(event) => set('role', event.target.value as UserRole)}
              disabled={Boolean(user) && !canManageStaff && user?.role !== 'student'}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {capitalize(role)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={fieldClass}
              value={draft.status}
              onChange={(event) => set('status', event.target.value as UserStatus)}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </Field>
        </div>
        {draft.role === 'student' ? (
          <Field label="Student registration number">
            <input
              className={fieldClass}
              value={draft.studentRegNo}
              onChange={(event) => set('studentRegNo', event.target.value)}
              placeholder="Optional"
            />
          </Field>
        ) : null}
        <Field label={user ? 'New password (optional)' : 'Temporary password'}>
          <input
            className={fieldClass}
            type="password"
            value={draft.password}
            onChange={(event) => set('password', event.target.value)}
            autoComplete="new-password"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={outlineButtonClass} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryButtonClass} disabled={busy || Boolean(problem)}>
            {busy ? 'Saving…' : user ? 'Save changes' : 'Create account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminUsers() {
  const { user: me } = useAuth();
  const canManageStaff = me?.role === 'super_admin';
  const [role, setRole] = useState<RoleFilter>('student');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PublicUser | null | 'new'>(null);
  const [suspending, setSuspending] = useState<PublicUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const suspendAction = useAction();

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  if (query.trim()) params.set('q', query.trim());

  const users = useApi<UserList>(`/api/v1/admin/users?${params.toString()}`);
  const reload = users.reload;

  async function confirmSuspend() {
    if (!suspending) return;
    const result = await suspendAction.run(() =>
      apiRequest<{ user: PublicUser }>(`/api/v1/admin/users/${suspending.id}`, {
        method: 'DELETE',
      }),
    );
    if (result) {
      setSuspending(null);
      setNotice(`Suspended ${result.user.fullName}.`);
      reload();
    }
  }

  const roleTabs: Array<{ value: RoleFilter; label: string }> = [
    { value: 'student', label: 'Students' },
    { value: 'admin', label: 'Admins' },
    { value: 'super_admin', label: 'Super admins' },
    { value: '', label: 'All' },
  ];

  return (
    <div>
      <PageHeading
        eyebrow="People"
        title="Users"
        description="Create student accounts, suspend access, and manage staff when you are a super admin."
        action={
          <button type="button" className={primaryButtonClass} onClick={() => setEditing('new')}>
            <Plus className="size-4" /> Add account
          </button>
        }
      />

      <div className="mt-6 space-y-4">
        {notice ? <Notice tone="success">{notice}</Notice> : null}
        {users.error ? <Notice tone="danger">{users.error}</Notice> : null}
        {!canManageStaff ? (
          <Notice tone="info">
            You can manage student accounts. Only a super admin can create or edit staff.
          </Notice>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            value={role}
            onChange={(value) => {
              setRole(value);
              setPage(1);
            }}
            options={roleTabs}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className={`${fieldClass} sm:w-40`}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              aria-label="Filter by status"
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <SearchBox
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search name, email, or reg no"
            />
          </div>
        </div>

        {users.loading && !users.data ? (
          <p className="text-sm text-[#7c8882]">Loading accounts…</p>
        ) : null}

        {users.data && users.data.users.length === 0 ? (
          <EmptyState
            title="No accounts match"
            text="Try a different filter, or create a student account."
            action={
              <button
                type="button"
                className={primaryButtonClass}
                onClick={() => setEditing('new')}
              >
                Add account
              </button>
            }
          />
        ) : null}

        {users.data && users.data.users.length > 0 ? (
          <>
            <DataTable columns={['Name', 'Contact', 'Role', 'Status', '']}>
              {users.data.users.map((account) => (
                <Row key={account.id}>
                  <Cell>
                    <p className="font-medium">{account.fullName}</p>
                    {account.studentRegNo ? (
                      <p className="text-xs text-[#8b9790]">{account.studentRegNo}</p>
                    ) : null}
                  </Cell>
                  <Cell>
                    <p>{account.email}</p>
                    <p className="text-xs text-[#8b9790]">{account.phone}</p>
                  </Cell>
                  <Cell>
                    <StatusPill status={account.role} label={capitalize(account.role)} />
                  </Cell>
                  <Cell>
                    <StatusPill status={account.status} />
                  </Cell>
                  <Cell>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className={outlineButtonClass}
                        onClick={() => setEditing(account)}
                        disabled={!canManageStaff && account.role !== 'student'}
                        aria-label={`Edit ${account.fullName}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className={dangerButtonClass}
                        onClick={() => setSuspending(account)}
                        disabled={
                          account.id === me?.id ||
                          account.status === 'suspended' ||
                          (!canManageStaff && account.role !== 'student')
                        }
                        aria-label={`Suspend ${account.fullName}`}
                      >
                        <UserX className="size-3.5" />
                      </button>
                    </div>
                  </Cell>
                </Row>
              ))}
            </DataTable>
            <Pager pagination={users.data.pagination} onPage={(next) => setPage(next)} />
          </>
        ) : null}
      </div>

      {editing === 'new' || editing ? (
        <UserModal
          user={editing === 'new' ? null : editing}
          canManageStaff={canManageStaff}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setNotice(message);
            reload();
          }}
        />
      ) : null}

      {suspending ? (
        <Modal title="Suspend account" onClose={() => setSuspending(null)}>
          <p className="text-sm text-[#7c8882]">
            {suspending.fullName} will not be able to sign in. Historical bookings and payments stay
            on record.
          </p>
          {suspendAction.error ? (
            <div className="mt-4">
              <Notice tone="danger">{suspendAction.error}</Notice>
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              className={outlineButtonClass}
              onClick={() => setSuspending(null)}
            >
              Keep active
            </button>
            <button
              type="button"
              className={dangerButtonClass}
              disabled={suspendAction.busy}
              onClick={() => void confirmSuspend()}
            >
              {suspendAction.busy ? 'Suspending…' : 'Suspend account'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
