// components/dashboard/RequestsPanel.tsx — how your own requests are doing.
import type { Dashboard, RequestStatus } from '@/lib/dashboardTypes';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/requests';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';

type RequestSummary = Dashboard['me']['requests'];

export function RequestsPanel({ requests }: { requests: RequestSummary }) {
  const present = (Object.entries(requests.counts) as [RequestStatus, number][]).filter(([, count]) => count > 0);

  return (
    <Panel label="My requests" channel="amber" href="/requests">
      {present.length === 0 ? (
        <EmptyState art="search" title="No requests yet" body="Repairs, access, orders and tickets show up here." action={{ href: '/requests/new', label: 'New request' }} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            <span className="font-medium tabular-nums">{requests.active}</span> still open of{' '}
            <span className="tabular-nums">{present.reduce((sum, [, count]) => sum + count, 0)}</span> in total
          </p>
          <ul className="flex flex-wrap gap-2">
            {present.map(([status, count]) => (
              <li key={status} className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]} <span className="tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
