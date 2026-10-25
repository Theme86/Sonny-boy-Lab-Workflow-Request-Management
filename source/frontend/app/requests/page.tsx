// app/requests/page.tsx  ->  /requests
// Members see their own requests; lab staff (TA, lecturer, lab manager) see everyone's.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import { PageHeading } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  fullName,
  type RequestListResponse,
} from '@/lib/requests';
import { ui } from '@/lib/ui';
import StatusBadge from './StatusBadge';

const PAGE_SIZE = 20;

export default function RequestsPage() {
  return (
    <AppShell>
      <RequestList />
    </AppShell>
  );
}

function RequestList() {
  const { user } = useCurrentUser();
  const isStaff = !!user && user.role !== 'member';

  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ key: string; data?: RequestListResponse; error?: string } | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    return params.toString();
  }, [status, type, page]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<RequestListResponse>(`/api/requests?${query}`)
      .then((data) => !cancelled && setResult({ key: query, data }))
      .catch((err) => !cancelled && setResult({ key: query, error: err?.message ?? 'Requests could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loading = result?.key !== query;
  const data = result?.key === query ? result.data : undefined;
  const error = result?.key === query ? result.error : undefined;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const first = data && data.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const last = data ? Math.min(page * PAGE_SIZE, data.total) : 0;
  const filtered = !!status || !!type;

  return (
    <div>
      <PageHeading
        title={isStaff ? 'All requests' : 'My requests'}
        subtitle={
          isStaff
            ? 'Open a request to assign it, move it forward or close it.'
            : 'Everything you have submitted, and where it stands.'
        }
        action={
          <Link href="/requests/new" className={ui.btnPrimary}>
            New request
          </Link>
        }
      />

      <div className={`overflow-hidden ${ui.card}`}>
        <div className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center ${ui.border}`}>
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className={`${ui.select} sm:w-48`}
          >
            <option value="">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className={`${ui.select} sm:w-56`}
          >
            <option value="">All types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {error}
          </p>
        )}

        {loading && !data && <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>Loading requests…</p>}

        {data && data.items.length === 0 && (
          <div className={`px-4 py-16 text-center text-sm ${ui.muted}`}>
            {filtered ? (
              'No requests match these filters.'
            ) : (
              <>
                {isStaff ? 'Nobody has submitted a request yet.' : 'You have not submitted a request yet.'}{' '}
                <Link href="/requests/new" className={ui.link}>
                  Submit a request
                </Link>
              </>
            )}
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={ui.muted}>
                <tr className={`border-b ${ui.border}`}>
                  <th scope="col" className="px-4 py-3 font-medium">No.</th>
                  <th scope="col" className="px-4 py-3 font-medium">Title</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium">Priority</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  {isStaff && <th scope="col" className="px-4 py-3 font-medium">Requested by</th>}
                  <th scope="col" className="px-4 py-3 font-medium">Assigned to</th>
                  <th scope="col" className="px-4 py-3 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.requestId} className={`border-b last:border-b-0 ${ui.border} ${ui.hover}`}>
                    <td className={`px-4 py-3 ${ui.muted}`}>{r.requestId}</td>
                    <td className="max-w-[18rem] px-4 py-3">
                      <Link href={`/requests/${r.requestId}`} className={`${ui.link} block truncate`} title={r.title}>
                        {r.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{TYPE_LABELS[r.type] ?? r.type}</td>
                    <td className="px-4 py-3">{r.priority ? (PRIORITY_LABELS[r.priority] ?? r.priority) : '–'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    {isStaff && <td className="px-4 py-3 whitespace-nowrap">{fullName(r.requester)}</td>}
                    <td className={`px-4 py-3 whitespace-nowrap ${r.assignee ? '' : ui.muted}`}>
                      {r.assignee ? fullName(r.assignee) : 'Not assigned'}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${ui.muted}`}>{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
