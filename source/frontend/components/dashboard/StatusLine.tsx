// components/dashboard/StatusLine.tsx — one thin line of facts under the header, like the parameter strip under a
// scope screen: rooms in use, equipment free, unread notifications, when the data was read.
import { formatTime } from '@/lib/dashboardTime';
import type { Dashboard } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';

/** "a / b", or "none yet" when there is nothing to count. */
const ratio = (part: number, whole: number) => (whole === 0 ? 'none yet' : `${part} / ${whole}`);

export function statusFacts({ me, lab, generatedAt }: Dashboard): [string, string][] {
  const rooms = lab.rooms.rooms;
  return [
    ['Rooms in use', ratio(rooms.filter((r) => r.inUseNow).length, rooms.length)],
    ['Equipment free', ratio(lab.equipment.unitsAvailable, lab.equipment.unitsTotal)],
    ['Unread', String(me.notifications.unread)],
    ['Updated', formatTime(generatedAt)],
  ];
}

export function StatusLine({ data }: { data: Dashboard }) {
  return (
    <dl className={`flex flex-wrap gap-x-5 gap-y-1 border-y py-2 text-sm ${dash.rule}`}>
      {statusFacts(data).map(([term, value]) => (
        <div key={term} className="flex gap-1.5">
          <dt className={dash.muted}>{term}</dt>
          <dd className={`font-medium ${dash.num}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
