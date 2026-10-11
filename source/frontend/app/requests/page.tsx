// app/requests/page.tsx  ->  /requests
// Shows the logged-in user's submitted requests (staff see everyone's).
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  API_URL,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  fullName,
  type RequestItem,
} from '@/lib/requests';
import StatusBadge from './StatusBadge';

export default function RequestsPage() {
  const { user, loading: authLoading, error: authError } = useRequireAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isStaff = user ? user.role !== 'member' : false;

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);

    fetch(`${API_URL}/api/requests?${params}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load requests');
        setItems(data.items);
        setTotal(data.total);
        setError('');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, status, type]);

  if (authLoading) return <p className="p-8">Loading...</p>;
  if (authError) return <p className="p-8 text-red-600">{authError}</p>;
  if (!user) return null; // redirecting to /login

  return (
    <main className="mx-auto w-full max-w-5xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{isStaff ? 'All requests' : 'My requests'}</h1>
          <p className="text-sm text-zinc-500">{total} request{total === 1 ? '' : 's'}</p>
        </div>
        <Link
          href="/requests/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          + New request
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <select
          aria-label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          aria-label="Filter by type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-md border border-zinc-300 bg-transparent px-2 py-1.5"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p>Loading requests...</p>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
          No requests found.{' '}
          <Link href="/requests/new" className="underline">Submit your first request</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Status</th>
                {isStaff && <th className="px-4 py-2">Requester</th>}
                <th className="px-4 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.requestId} className="border-t border-zinc-200">
                  <td className="px-4 py-2 text-zinc-500">{r.requestId}</td>
                  <td className="px-4 py-2">
                    <Link href={`/requests/${r.requestId}`} className="font-medium underline-offset-2 hover:underline">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{TYPE_LABELS[r.type] ?? r.type}</td>
                  <td className="px-4 py-2 capitalize">{r.priority ?? '-'}</td>
                  <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                  {isStaff && <td className="px-4 py-2">{fullName(r.requester)}</td>}
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
