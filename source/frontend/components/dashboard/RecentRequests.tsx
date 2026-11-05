// components/dashboard/RecentRequests.tsx — your newest requests with their status; each row opens the request.
import Link from 'next/link';
import { dayLabel } from '@/lib/dashboardTime';
import type { RecentRequest } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { TYPE_LABELS } from '@/lib/requests';
import { EmptyLine, Section } from './Section';
import { StatusText } from './StatusText';

function RequestRow({ request, now }: { request: RecentRequest; now: Date }) {
  return (
    <li>
      <Link href={`/requests/${request.requestId}`} className={`grid grid-cols-[3.5rem_1fr_auto] items-baseline gap-x-4 px-4 py-3 hover:bg-[#f6f7f9] dark:hover:bg-[#262729] ${dash.focus}`}>
        <span className={`text-sm ${dash.muted} ${dash.num}`}>#{request.requestId}</span>
        <span className="min-w-0 text-sm">
          <span className="block truncate font-medium">{request.title}</span>
          <span className={dash.muted}>
            {TYPE_LABELS[request.type] ?? request.type} · {dayLabel(request.createdAt, now)}
          </span>
        </span>
        <StatusText status={request.status} kind="request" />
      </Link>
    </li>
  );
}

export function RecentRequests({ requests, active, now = new Date() }: { requests: RecentRequest[]; active: number; now?: Date }) {
  return (
    <Section title="My requests" count={active || undefined} href="/requests">
      {requests.length === 0 ? (
        <EmptyLine action={{ href: '/requests/new', label: 'New request' }}>You have not sent any requests.</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {requests.map((r) => (
            <RequestRow key={r.requestId} request={r} now={now} />
          ))}
        </ul>
      )}
    </Section>
  );
}
