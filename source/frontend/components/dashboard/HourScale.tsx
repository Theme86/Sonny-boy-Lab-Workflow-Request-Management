// components/dashboard/HourScale.tsx — the row of hour labels above the room lanes.
import { dash } from '@/lib/dashboardUi';
import { COLUMNS } from './roomGrid';

export function HourScale({ labels }: { labels: number[] }) {
  return (
    <div className={`grid ${COLUMNS} gap-3 border-b px-4 pt-2 pb-1 ${dash.rule}`} aria-hidden>
      <span />
      <div className={`flex text-xs ${dash.muted} ${dash.num}`}>
        {labels.map((h, i) => (
          <span key={h} className="flex-1">
            {i % 2 === 0 ? String(h).padStart(2, '0') : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
