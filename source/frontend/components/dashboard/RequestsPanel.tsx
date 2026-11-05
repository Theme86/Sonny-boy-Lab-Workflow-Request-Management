// components/dashboard/RequestsPanel.tsx — how your own requests are doing.
import type { Dashboard, RequestStatus } from '@/lib/dashboardTypes';
import { STATUS_LABELS, STATUS_STYLES } from '@/lib/requests';
import { EmptyNote, Panel } from './Panel';
import { Readout } from './Readout';

type RequestSummary = Dashboard['me']['requests'];

export function RequestsPanel({ requests }: { requests: RequestSummary }) {
  const present = (Object.entries(requests.counts) as [RequestStatus, number][]).filter(([, count]) => count > 0);

  return (
    <Panel label="My requests" href="/requests">
      {present.length === 0 ? (
        <EmptyNote>You have not made any requests yet.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-4">
          <Readout value={requests.active} label="still open" />
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
