// components/dashboard/MemberAlerts.tsx — "Needs your attention" for your own requests: shown only when one of them
// is blocked (waiting on you) or was rejected. Nothing to say → nothing shown.
import Link from 'next/link';
import type { RequestStatus } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { toneClass } from './StatusText';

const MESSAGES: { status: RequestStatus; one: string; many: string; tone: 'warn' | 'fault' }[] = [
  { status: 'blocked', one: 'request is blocked and may need more information from you', many: 'requests are blocked and may need more information from you', tone: 'warn' },
  { status: 'rejected', one: 'request was rejected', many: 'requests were rejected', tone: 'fault' },
];

export function memberAlerts(counts: Record<RequestStatus, number>) {
  return MESSAGES.filter((m) => counts[m.status] > 0).map((m) => ({
    ...m,
    text: `${counts[m.status]} ${counts[m.status] === 1 ? m.one : m.many}`,
  }));
}

export function MemberAlerts({ counts }: { counts: Record<RequestStatus, number> }) {
  const alerts = memberAlerts(counts);
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Needs your attention" className={`${dash.surface} border-l-2 border-l-[#f9ab00] px-4 py-3`}>
      <h2 className={dash.heading}>Needs your attention</h2>
      <ul className="mt-1 flex flex-col gap-1 text-sm">
        {alerts.map((a) => (
          <li key={a.status}>
            <span className={toneClass(a.tone)}>{a.text}.</span>{' '}
            <Link href="/requests" className={dash.link}>
              Open requests
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
