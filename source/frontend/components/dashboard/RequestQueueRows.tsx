// components/dashboard/RequestQueueRows.tsx — one queued request, and the summary line under the queue.
import Link from 'next/link';
import { ageText } from '@/lib/dashboardTime';
import type { Attention, QueuedRequest } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { TYPE_LABELS } from '@/lib/requests';
import { toneClass } from './StatusText';

export type RequestAttention = NonNullable<Attention['requests']>;

export function QueueRow({ request, now }: { request: QueuedRequest; now: Date }) {
  return (
    <li>
      <Link href={`/requests/${request.requestId}`} className={`grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-4 px-4 py-3 text-sm hover:bg-vl-hover ${dash.focus}`}>
        <span className={`${dash.muted} ${dash.num}`}>#{request.requestId}</span>
        <span className="min-w-0">
          <span className="block truncate font-medium">{request.title}</span>
          <span className={dash.muted}>
            {TYPE_LABELS[request.type] ?? request.type}
            {request.priority === 'high' && <span className={toneClass('fault')}> · high priority</span>}
          </span>
        </span>
        <span className={`${dash.muted} ${dash.num}`} title="Waiting for">
          {ageText(request.createdAt, now)}
        </span>
      </Link>
    </li>
  );
}

export function Summary({ requests }: { requests: RequestAttention }) {
  const repairs = requests.underMaintenance.map((e) => e.name).join(', ');
  return (
    <p className={`border-t px-4 py-2.5 text-sm ${dash.rule} ${dash.muted}`}>
      <span className={requests.blocked > 0 ? toneClass('fault') : ''}>Blocked {requests.blocked}</span>
      {' · '}Assigned to you {requests.assignedToMe}
      {repairs && ` · Under maintenance: ${repairs}`}
    </p>
  );
}
