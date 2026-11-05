// components/dashboard/UpcomingSessions.tsx — your next lab sessions (requested or joined) as a short table.
import { dayLabel, formatRange } from '@/lib/dashboardTime';
import type { UpcomingSession } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';
import { StatusText } from './StatusText';

function SessionRow({ session, now }: { session: UpcomingSession; now: Date }) {
  return (
    <li className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-0.5 px-4 py-3 sm:grid-cols-[7rem_1fr_9rem]">
      <span className={`text-sm ${dash.num}`}>
        <span className="block font-medium">{dayLabel(session.start, now)}</span>
        <span className={dash.muted}>{formatRange(session.start, session.end)}</span>
      </span>
      <span className="min-w-0 text-sm">
        <span className="block truncate font-medium">{session.name}</span>
        <span className={dash.muted}>{session.room.name}</span>
      </span>
      <span className="col-start-2 sm:col-start-auto sm:text-right">
        <StatusText status={session.status} kind="session" />
      </span>
    </li>
  );
}

export function UpcomingSessions({ sessions, now = new Date() }: { sessions: UpcomingSession[]; now?: Date }) {
  return (
    <Section title="Upcoming sessions" href="/labsessions">
      {sessions.length === 0 ? (
        <EmptyLine action={{ href: '/labsessions/new', label: 'Book a session' }}>You have no sessions booked.</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {sessions.map((s) => (
            <SessionRow key={s.labSessionId} session={s} now={now} />
          ))}
        </ul>
      )}
    </Section>
  );
}
