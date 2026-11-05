// components/dashboard/NextSessionPanel.tsx — the next lab session you requested or joined.
import { dayLabel, formatRange } from '@/lib/dashboardTime';
import type { NextSession } from '@/lib/dashboardTypes';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';

const STATUS_TEXT: Record<string, string> = {
  pending_approval: 'Waiting for approval',
  approved: 'Approved',
  scheduled: 'Scheduled',
  in_progress: 'Happening now',
};

export function NextSessionPanel({ session, now = new Date() }: { session: NextSession | null; now?: Date }) {
  return (
    <Panel label="Next session" channel="violet" href="/labsessions">
      {session ? (
        <div>
          <p className="text-xl font-medium">{session.name}</p>
          <p className="mt-3 text-lg tabular-nums" style={{ fontFamily: monoFamily }}>
            {dayLabel(session.start, now)} · {formatRange(session.start, session.end)}
          </p>
          <p className={`mt-1 text-sm ${ui.muted}`}>
            {session.room.name} · {STATUS_TEXT[session.status] ?? session.status}
          </p>
        </div>
      ) : (
        <EmptyState art="flat" title="Nothing booked" body="No upcoming lab sessions." action={{ href: '/labsessions/new', label: 'Book a session' }} />
      )}
    </Panel>
  );
}
