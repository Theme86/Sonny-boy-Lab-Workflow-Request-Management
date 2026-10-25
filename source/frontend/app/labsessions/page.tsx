// app/sessions/page.tsx — one page for every role.
// Members see their own sessions; lecturers / lab managers see all of them plus
// approval actions. The API enforces this, the UI only hides what you can't use.
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { ui } from '@/lib/ui';

type Status =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type Session = {
  labSessionId: number;
  name: string;
  description: string | null;
  status: Status;
  archived: boolean;
  requestedBy: number;
  requestedStart: string;
  requestedEnd: string;
  room: { roomId: number; name: string };
  project: { projectId: number; name: string } | null;
  requester: { userId: number; firstName: string; lastName: string };
};

const MANAGER_ROLES = ['lecturer', 'lab_manager'];
const ARCHIVABLE: Status[] = ['completed', 'cancelled', 'rejected'];
const CANCELLABLE: Status[] = ['pending_approval', 'approved', 'scheduled'];

// what a manager can move a session to next (mirrors the backend TRANSITIONS table)
const MANAGER_NEXT: Partial<Record<Status, { to: Status; label: string }[]>> = {
  pending_approval: [
    { to: 'approved', label: 'Approve' },
    { to: 'rejected', label: 'Reject' },
  ],
  approved: [{ to: 'scheduled', label: 'Schedule' }],
  scheduled: [{ to: 'in_progress', label: 'Start' }],
  in_progress: [{ to: 'completed', label: 'Complete' }],
};

const STATUS_LABEL: Record<Status, string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Rejected',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<Status, string> = {
  pending_approval: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
  scheduled: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200',
  in_progress: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200',
  completed: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  rejected: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
  cancelled: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function SessionsPage() {
  return (
    <AppShell>
      <Sessions />
    </AppShell>
  );
}

function Sessions() {
  const { user } = useCurrentUser();
  const isManager = !!user && MANAGER_ROLES.includes(user.role);

  // managers get a "needs approval" tab; everyone gets "all" and "archived"
  const [tab, setTab] = useState<'all' | 'pending' | 'archived'>('all');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (tab === 'pending') params.set('status', 'pending_approval');
    if (tab === 'archived') params.set('archived', 'true');
    try {
      setSessions(await apiFetch<Session[]>(`/api/lab-sessions?${params}`));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(s: Session, to: Status) {
    setBusyId(s.labSessionId);
    setError('');
    try {
      await apiFetch(`/api/lab-sessions/${s.labSessionId}/status`, {
        method: 'POST',
        json: { status: to },
      });
      await load();
    } catch (err) {
      // e.g. 409 "Room is already booked for that time"
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function archive(s: Session) {
    if (!confirm(`Archive "${s.name}"?`)) return;
    setBusyId(s.labSessionId);
    setError('');
    try {
      await apiFetch(`/api/lab-sessions/${s.labSessionId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'all', label: isManager ? 'All sessions' : 'My sessions' },
    ...(isManager ? [{ key: 'pending' as const, label: 'Needs approval' }] : []),
    { key: 'archived', label: 'Archived' },
  ];

  const btn =
    'rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ring-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-800';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading
          title="Lab sessions"
          subtitle={isManager ? 'Review, approve and run lab sessions.' : 'Your lab session requests.'}
        />
        <Link
          href="/labsessions/new"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b57d0] px-5 text-sm font-medium whitespace-nowrap text-white hover:bg-[#0a4cb8]"
        >
          <span aria-hidden className="text-lg leading-none">+</span>
          Create session
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t.key
                ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading && <p className={ui.muted}>Loading...</p>}
      {!loading && sessions.length === 0 && <p className={ui.muted}>No sessions here.</p>}

      <ul className="grid gap-3">
        {sessions.map((s) => {
          const isOwner = s.requestedBy === user.userId;
          const busy = busyId === s.labSessionId;
          const managerActions = isManager ? MANAGER_NEXT[s.status] ?? [] : [];
          const canCancel = (isManager || isOwner) && CANCELLABLE.includes(s.status);
          const canArchive = (isManager || isOwner) && !s.archived && ARCHIVABLE.includes(s.status);

          return (
            <li key={s.labSessionId} className={`${ui.card} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-medium">{s.name}</p>
                  <p className={`text-sm ${ui.muted}`}>
                    {s.room.name} · {fmt(s.requestedStart)} – {fmt(s.requestedEnd)}
                  </p>
                  {isManager && (
                    <p className={`text-sm ${ui.muted}`}>
                      Requested by {s.requester.firstName} {s.requester.lastName}
                      {s.project ? ` · ${s.project.name}` : ''}
                    </p>
                  )}
                  {s.description && <p className="mt-1 text-sm">{s.description}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>

              {(managerActions.length > 0 || canCancel || canArchive) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {managerActions.map((a) => (
                    <button key={a.to} disabled={busy} onClick={() => changeStatus(s, a.to)} className={btn}>
                      {a.label}
                    </button>
                  ))}
                  {canCancel && (
                    <button disabled={busy} onClick={() => changeStatus(s, 'cancelled')} className={btn}>
                      Cancel
                    </button>
                  )}
                  {canArchive && (
                    <button disabled={busy} onClick={() => archive(s)} className={btn}>
                      Archive
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}