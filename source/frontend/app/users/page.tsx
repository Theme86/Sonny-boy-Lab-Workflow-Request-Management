// app/users/page.tsx — user management for the Lab Manager (US-09)
// View all users, search, filter, sort by registered time / email / role, change role, (de)activate.
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '@/components/icons';
import { PageHeading } from '@/components/ProfileView';
import { StatusBadge } from '@/components/RoleBadge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { ui } from '@/lib/ui';
import { formatDate, fullName, ROLE_LABELS, ROLES, type Role, type User, type UserListResponse } from '@/lib/users';

type SortKey = 'createdAt' | 'lastLoginAt' | 'email' | 'role' | 'name';
const PAGE_SIZE = 20;

export default function UsersPage() {
  return (
    <AppShell>
      <UsersGate />
    </AppShell>
  );
}

function UsersGate() {
  const { user } = useCurrentUser();
  if (!user) return null;
  if (user.role !== 'lab_manager') {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-[22px]">You don&apos;t have access to this page</h1>
        <p className={`mt-2 text-sm ${ui.muted}`}>Only the Lab Manager can manage users.</p>
        <Link href="/profile" className={`${ui.btnOutline} mt-6`}>
          Go to personal info
        </Link>
      </div>
    );
  }
  return <UserManagement me={user} />;
}

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function UserManagement({ me }: { me: User }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<SortKey>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<{ key: string; data?: UserListResponse; error?: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const q = useDebounced(search.trim());

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({ sort, order, status, page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    return params.toString();
  }, [q, role, status, sort, order, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UserListResponse>(`/api/users?${queryKey}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Users could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  // the notice disappears by itself after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const loading = result?.key !== queryKey;
  const data = result?.data ?? null; // keeps showing the previous page while the next one loads
  const error = loading ? '' : (result?.error ?? '');

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }
  const changeSearch = resetPage(setSearch);
  const changeRole = resetPage(setRole);
  const changeStatus = resetPage(setStatus);

  function sortBy(key: SortKey) {
    if (key === sort) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setOrder(key === 'createdAt' || key === 'lastLoginAt' ? 'desc' : 'asc');
    }
    setPage(1);
  }

  function replaceUser(updated: User) {
    setResult((r) =>
      r?.data ? { ...r, data: { ...r.data, users: r.data.users.map((u) => (u.userId === updated.userId ? updated : u)) } } : r,
    );
  }

  async function updateRole(target: User, newRole: Role) {
    if (newRole === target.role) return;
    const ok = window.confirm(`Change ${fullName(target)} from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[newRole]}?`);
    if (!ok) return;
    setBusyId(target.userId);
    try {
      const updated = await apiFetch<User>(`/api/users/${target.userId}/role`, { method: 'PATCH', json: { role: newRole } });
      replaceUser(updated);
      setNotice(`${fullName(updated)} is now ${ROLE_LABELS[updated.role]}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'The role could not be changed');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(target: User) {
    const next = !target.active;
    const ok = window.confirm(
      next
        ? `Reactivate ${fullName(target)}? They will be able to sign in again.`
        : `Deactivate ${fullName(target)}? They won't be able to sign in until you reactivate them.`,
    );
    if (!ok) return;
    setBusyId(target.userId);
    try {
      const updated = await apiFetch<User>(`/api/users/${target.userId}/active`, { method: 'PATCH', json: { active: next } });
      replaceUser(updated);
      setNotice(`${fullName(updated)} ${updated.active ? 'reactivated' : 'deactivated'}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'The account could not be updated');
    } finally {
      setBusyId(null);
    }
  }

  const first = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const last = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  const nameBlock = (u: User) => (
    <Link href={`/users/${u.userId}`} className={`flex min-w-0 items-center gap-3 rounded-lg ${ui.focus}`}>
      <Avatar user={u} size="md" />
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium hover:underline">
          {fullName(u)}
          {u.userId === me.userId && <span className={`ml-1 text-sm font-normal ${ui.muted}`}>(you)</span>}
        </span>
        <span className={`block truncate text-xs ${ui.muted}`}>{u.email}</span>
        {(u.studentId || u.department) && (
          <span className={`block truncate text-xs ${ui.muted}`}>{[u.studentId, u.department].filter(Boolean).join(', ')}</span>
        )}
      </span>
    </Link>
  );

  const roleSelect = (u: User, className = '') => (
    <select
      value={u.role}
      onChange={(e) => updateRole(u, e.target.value as Role)}
      disabled={u.userId === me.userId || busyId === u.userId}
      title={u.userId === me.userId ? "You can't change your own role" : undefined}
      className={`${ui.select} h-9 ${className}`}
      aria-label={`Role for ${fullName(u)}`}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );

  const activeButton = (u: User) =>
    u.userId === me.userId ? null : (
      <button
        type="button"
        onClick={() => toggleActive(u)}
        disabled={busyId === u.userId}
        className={u.active ? ui.btnDanger : `${ui.btnText} h-9`}
      >
        {u.active ? 'Deactivate' : 'Reactivate'}
      </button>
    );

  return (
    <div>
      <PageHeading
        title="Users"
        subtitle="Everyone who has signed in to the lab system. Give new lecturers and TAs their role here."
      />

      <div className={`overflow-hidden ${ui.card}`}>
        {/* Filters */}
        <div className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center ${ui.border}`}>
          <label className="relative block lg:flex-1">
            <span className="sr-only">Search users</span>
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#5f6368] dark:text-[#9aa0a6]" />
            <input
              type="search"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search by name, email, ID or department"
              className="h-11 w-full rounded-full bg-[#f1f3f4] pr-4 pl-11 text-[15px] outline-none placeholder:text-[#5f6368] focus:bg-white focus:ring-2 focus:ring-[#1558b0] dark:bg-[#303134] dark:placeholder:text-[#9aa0a6] dark:focus:ring-[#a8c7fa]"
            />
          </label>
          <div className="flex gap-3">
            <select value={role} onChange={(e) => changeRole(e.target.value as Role | '')} className={`${ui.select} flex-1 lg:w-48 lg:flex-none`} aria-label="Filter by role">
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select value={status} onChange={(e) => changeStatus(e.target.value as typeof status)} className={`${ui.select} flex-1 lg:w-40 lg:flex-none`} aria-label="Filter by status">
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {error}
          </p>
        )}

        {/* Phones: one card per person */}
        <ul className={`md:hidden ${loading ? 'opacity-60' : ''}`}>
          {data?.users.map((u) => (
            <li key={u.userId} className={`border-b px-4 py-4 last:border-b-0 ${ui.border}`}>
              {nameBlock(u)}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                {roleSelect(u, 'min-w-0 flex-1')}
                <StatusBadge active={u.active} />
                {activeButton(u)}
              </div>
              <p className={`mt-2 text-xs ${ui.muted}`}>
                Registered {formatDate(u.createdAt)}, last sign-in {formatDate(u.lastLoginAt)}
              </p>
            </li>
          ))}
        </ul>

        {/* Tablets and up: a table that fits the screen (no sideways scrolling) */}
        <table className="hidden w-full table-auto text-left text-sm md:table">
          <thead className={ui.muted}>
            <tr className={`border-b ${ui.border}`}>
              <SortHeader label="Name" sortKey="name" sort={sort} order={order} onSort={sortBy} />
              <SortHeader label="Role" sortKey="role" sort={sort} order={order} onSort={sortBy} />
              <SortHeader label="Registered" sortKey="createdAt" sort={sort} order={order} onSort={sortBy} className="hidden 2xl:table-cell" />
              <SortHeader label="Last sign-in" sortKey="lastLoginAt" sort={sort} order={order} onSort={sortBy} className="hidden xl:table-cell" />
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60' : ''}>
            {data?.users.map((u) => (
              <tr key={u.userId} className={`border-b last:border-b-0 ${ui.border} hover:bg-[#f8f9fa] dark:hover:bg-[#28292a]`}>
                <td className="w-full max-w-0 px-4 py-3">
                  {nameBlock(u)}
                  <p className={`mt-1 pl-[52px] text-xs xl:hidden ${ui.muted}`}>
                    Last sign-in {formatDate(u.lastLoginAt)}
                    {!u.active && ' · Deactivated'}
                  </p>
                </td>
                <td className="px-4 py-3">{roleSelect(u, 'w-44')}</td>
                <td className={`hidden px-4 py-3 whitespace-nowrap 2xl:table-cell ${ui.muted}`}>{formatDate(u.createdAt)}</td>
                <td className={`hidden px-4 py-3 whitespace-nowrap xl:table-cell ${ui.muted}`}>{formatDate(u.lastLoginAt, true)}</td>
                <td className="hidden px-4 py-3 whitespace-nowrap lg:table-cell">
                  <StatusBadge active={u.active} />
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{activeButton(u)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.users.length === 0 && (
          <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>No users match your search. Try a different name or clear the filters.</p>
        )}
        {!data && loading && <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>Loading users…</p>}

        {data && data.total > 0 && (
          <div className={`flex items-center justify-end gap-2 border-t px-4 py-2 text-sm ${ui.border} ${ui.muted}`}>
            <span className="mr-2">
              {first}–{last} of {data.total}
            </span>
            <button
              type="button"
              aria-label="Previous page"
              className={`rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`}
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Next page"
              className={`rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`}
              disabled={page >= data.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>

      {/* Snackbar */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded bg-[#313131] py-3.5 pr-2 pl-4 text-sm text-[#f2f2f2] shadow-lg sm:left-6 sm:translate-x-0 dark:bg-[#e3e3e3] dark:text-[#313131]"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="rounded px-3 py-1.5 font-medium text-[#a8c7fa] hover:bg-white/10 dark:text-[#1558b0] dark:hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  order,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: SortKey;
  sort: SortKey;
  order: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort === sortKey;
  return (
    <th className={`px-4 py-3 font-medium ${className}`} aria-sort={active ? (order === 'asc' ? 'ascending' : 'descending') : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded ${ui.focus} ${active ? 'text-[#1f1f1f] dark:text-[#e3e3e3]' : 'hover:text-[#1f1f1f] dark:hover:text-[#e3e3e3]'}`}
      >
        {label}
        <span aria-hidden className={active ? '' : 'invisible'}>
          {order === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </th>
  );
}
