// components/dashboard/RequestQueue.tsx — for staff: open requests nobody has picked up (oldest first, like a queue),
// with a one-line summary of blocked work, work assigned to you, and equipment under maintenance.
import { dash } from '@/lib/dashboardUi';
import { QueueRow, Summary, type RequestAttention } from './RequestQueueRows';
import { EmptyLine, Section } from './Section';

export function RequestQueue({ requests, now = new Date() }: { requests: RequestAttention; now?: Date }) {
  const { unassigned } = requests;
  return (
    <Section title="Requests nobody has picked up" count={unassigned.total} href="/requests">
      {unassigned.total === 0 ? (
        <EmptyLine>Every open request has someone on it.</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {unassigned.items.map((r) => (
            <QueueRow key={r.requestId} request={r} now={now} />
          ))}
        </ul>
      )}
      <Summary requests={requests} />
    </Section>
  );
}
