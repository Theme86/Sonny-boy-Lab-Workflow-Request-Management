// components/dashboard/ApprovalQueue.tsx — sessions waiting for approval (lecturers and lab managers only),
// soonest first, with who asked. Approving happens on the Lab sessions page.
import { dayLabel, formatRange } from '@/lib/dashboardTime';
import type { Limited, PendingSession } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';

function PendingRow({ session, now }: { session: PendingSession; now: Date }) {
  return (
    <li className="grid grid-cols-[7rem_1fr] gap-x-4 px-4 py-3 text-sm sm:grid-cols-[7rem_1fr_10rem]">
      <span className={dash.num}>
        <span className="block font-medium">{dayLabel(session.start, now)}</span>
        <span className={dash.muted}>{formatRange(session.start, session.end)}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{session.name}</span>
        <span className={dash.muted}>{session.roomName}</span>
      </span>
      <span className={`col-start-2 sm:col-start-auto sm:text-right ${dash.muted}`}>{session.requestedBy}</span>
    </li>
  );
}

export function ApprovalQueue({ queue, now = new Date() }: { queue: Limited<PendingSession>; now?: Date }) {
  return (
    <Section title="Waiting for your approval" count={queue.total} href="/labsessions" linkText="Review">
      {queue.total === 0 ? (
        <EmptyLine>No sessions are waiting for approval.</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {queue.items.map((s) => (
            <PendingRow key={s.labSessionId} session={s} now={now} />
          ))}
        </ul>
      )}
    </Section>
  );
}
