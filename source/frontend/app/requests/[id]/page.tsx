// app/requests/[id]/page.tsx  ->  /requests/:id
// Detail view of one submitted request.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import {
  API_URL,
  STATUS_LABELS,
  TYPE_LABELS,
  formatDate,
  fullName,
  type RequestDetail,
} from '@/lib/requests';
import StatusBadge from '../StatusBadge';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-t border-zinc-200 py-2 text-sm">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="col-span-2">{children}</dd>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading, error: authError } = useRequireAuth();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/requests/${id}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? 'Failed to load request');
        setRequest(data.request);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, id]);

  if (authLoading || (user && loading)) return <p className="p-8">Loading...</p>;
  if (authError) return <p className="p-8 text-red-600">{authError}</p>;
  if (!user) return null; // redirecting to /login

  return (
    <main className="mx-auto w-full max-w-2xl p-6 sm:p-8">
      <Link href="/requests" className="text-sm text-zinc-500 hover:underline">← Back to requests</Link>

      {error || !request ? (
        <p className="mt-6 text-red-600">{error || 'Request not found'}</p>
      ) : (
        <>
          <div className="mt-2 mb-6 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              <span className="text-zinc-400">#{request.requestId}</span> {request.title}
            </h1>
            <StatusBadge status={request.status} />
          </div>

          <dl>
            <Row label="Type">{TYPE_LABELS[request.type] ?? request.type}</Row>
            <Row label="Priority"><span className="capitalize">{request.priority ?? '-'}</span></Row>
            <Row label="Description"><p className="whitespace-pre-wrap">{request.description || '-'}</p></Row>
            <Row label="Requested by">{fullName(request.requester)} ({request.requester.email})</Row>
            <Row label="Assigned to">{request.assignee ? fullName(request.assignee) : 'Not assigned yet'}</Row>
            {request.equipment && <Row label="Equipment">{request.equipment.name} (#{request.equipment.equipmentId})</Row>}
            {request.accessDetail && (
              <Row label="Access">
                {request.accessDetail.resourceType}
                {request.accessDetail.resourceId ? ` #${request.accessDetail.resourceId}` : ''}
                {request.accessDetail.expiresAt ? `, until ${new Date(request.accessDetail.expiresAt).toLocaleDateString()}` : ''}
              </Row>
            )}
            {request.consumableOrderItems.length > 0 && (
              <Row label="Items">
                <ul className="list-disc pl-4">
                  {request.consumableOrderItems.map((i) => (
                    <li key={i.orderItemId}>{i.consumable.name}: {i.quantityRequested} {i.consumable.unit}</li>
                  ))}
                </ul>
              </Row>
            )}
            <Row label="Submitted">{formatDate(request.createdAt)}</Row>
            {request.closedAt && <Row label="Closed">{formatDate(request.closedAt)}</Row>}
          </dl>

          <h2 className="mt-8 mb-2 text-lg font-semibold">Status history</h2>
          <ol className="space-y-2 text-sm">
            {request.statusHistory.map((h) => (
              <li key={h.historyId} className="rounded-md border border-zinc-200 px-3 py-2">
                <span className="font-medium">
                  {h.oldStatus ? `${STATUS_LABELS[h.oldStatus] ?? h.oldStatus} → ` : 'Created as '}
                  {h.newStatus ? STATUS_LABELS[h.newStatus] ?? h.newStatus : '-'}
                </span>
                <span className="text-zinc-500">
                  {' '}· {formatDate(h.changedAt)}{h.changer ? ` · ${fullName(h.changer)}` : ''}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
