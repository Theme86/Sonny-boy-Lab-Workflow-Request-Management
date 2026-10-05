// app/users/page.tsx — user management for the Lab Manager (US-09)
// View all users, search, filter, sort by registered time / email / role, change role, (de)activate.
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Avatar } from '@/components/Avatar';
import { buttonStyles } from '@/components/ProfileCard';
import { StatusBadge } from '@/components/RoleBadge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { formatDate, fullName, ROLE_LABELS, ROLES, type Role, type User, type UserListResponse } from '@/lib/users';

type SortKey = 'createdAt' | 'lastLoginAt' | 'email' | 'role' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'createdAt', label: 'Registered' },
  { value: 'lastLoginAt', label: 'Last login' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'role', label: 'Role' },
];

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
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Lab Manager only</p>
        <p className="mt-2 text-sm text-zinc-500">You don&apos;t have permission to manage users.</p>
        <Link href="/profile" className={`${buttonStyles.secondary} mt-6`}>
          Back to my profile
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
    const params = new URLSearchParams({ sort, order, status, page: String(page), pageSize: '20' });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    return params.toString();
  }, [q, role, status, sort, order, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<UserListResponse>(`/api/users?${queryKey}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Could not load users' }));
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  const loading = result?.key !== queryKey;
  const data = result?.data ?? null; // keeps showing the previous page while the next one loads
  const error = loading ? '' : (result?.error ?? '');

  // Any filter change sends you back to page 1
  function updateFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }
  const setSearchAndReset = updateFilter(setSearch);
  const setRoleAndReset = updateFilter(setRole);
  const setStatusAndReset = updateFilter(setStatus);
  const setSortAndReset = updateFilter(setSort);

  function replaceUser(updated: User) {
    setResult((r) =>
      r?.data ? { ...r, data: { ...r.data, users: r.data.users.map((u) => (u.userId === updated.userId ? updated : u)) } } : r,
    );
  }

  async function changeRole(target: User, newRole: Role) {
    if (newRole === target.role) return;
    const ok = window.confirm(`Change ${fullName(target)}'s role from ${ROLE_LABELS[target.role]} to ${ROLE_LABELS[newRole]}?`);
    if (!ok) return;
    setBusyId(target.userId);
    setNotice('');
    try {
      const updated = await apiFetch<User>(`/api/users/${target.userId}/role`, { method: 'PATCH', json: { role: newRole } });
      replaceUser(updated);
      setNotice(`${fullName(updated)} is now ${ROLE_LABELS[updated.role]}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not change role');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(target: User) {
    const next = !target.active;
    const ok = window.confirm(
      next
        ? `Reactivate ${fullName(target)}? They will be able to sign in again.`
        : `Deactivate ${fullName(target)}? They will no longer be able to sign in.`,
    );
    if (!ok) return;
    setBusyId(target.userId);
    setNotice('');
    try {
      const updated = await apiFetch<User>(`/api/users/${target.userId}/active`, { method: 'PATCH', json: { active: next } });
      replaceUser(updated);
      setNotice(`${fullName(updated)} was ${updated.active ? 'reactivated' : 'deactivated'}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not update the account');
    } finally {
      setBusyId(null);
    }
  }

  const controlClass =
    'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-emerald-900';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Everyone who has signed in to the lab system. Give new lecturers and TAs their role here.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 lg:flex-row lg:items-center dark:border-zinc-800 dark:bg-zinc-900">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearchAndReset(e.target.value)}
          placeholder="Search name, email, ID or department…"
          className={`${controlClass} lg:flex-1`}
          aria-label="Search users"
        />
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <select value={role} onChange={(e) => setRoleAndReset(e.target.value as Role | '')} className={controlClass} aria-label="Filter by role">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatusAndReset(e.target.value as typeof status)} className={controlClass} aria-label="Filter by status">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <select value={sort} onChange={(e) => setSortAndReset(e.target.value as SortKey)} className={controlClass} aria-label="Sort by">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
              setPage(1);
            }}
            className={buttonStyles.secondary}
            aria-label={order === 'asc' ? 'Ascending order' : 'Descending order'}
            title={order === 'asc' ? 'Ascending' : 'Descending'}
          >
            {order === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Registered</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-zinc-100 dark:divide-zinc-800 ${loading ? 'opacity-60' : ''}`}>
              {data?.users.map((u) => {
                const isMe = u.userId === me.userId;
                const busy = busyId === u.userId;
                return (
                  <tr key={u.userId} className={u.active ? '' : 'bg-zinc-50/60 dark:bg-zinc-950/40'}>
                    <td className="px-4 py-3">
                      <Link href={`/users/${u.userId}`} className="group flex items-center gap-3">
                        <Avatar user={u} size="md" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
                            {fullName(u)} {isMe && <span className="text-xs font-normal text-zinc-500">(you)</span>}
                          </span>
                          <span className="block truncate text-xs text-zinc-500">
                            {u.email}
                            {u.studentId && <> · {u.studentId}</>}
                          </span>
                          {u.department && <span className="block truncate text-xs text-zinc-400">{u.department}</span>}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u, e.target.value as Role)}
                        disabled={isMe || busy}
                        title={isMe ? "You can't change your own role" : undefined}
                        className={`${controlClass} py-1.5 disabled:cursor-not-allowed disabled:opacity-60`}
                        aria-label={`Role for ${fullName(u)}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{formatDate(u.lastLoginAt, true)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge active={u.active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          disabled={busy}
                          className={`${u.active ? buttonStyles.danger : buttonStyles.secondary} px-3 py-1.5 text-xs`}
                        >
                          {u.active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data && data.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No users match these filters.
                  </td>
                </tr>
              )}
              {!data && loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                    Loading users…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <span>
              {data.total} user{data.total === 1 ? '' : 's'} · page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${buttonStyles.secondary} px-3 py-1.5`}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className={`${buttonStyles.secondary} px-3 py-1.5`}
                disabled={page >= data.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
