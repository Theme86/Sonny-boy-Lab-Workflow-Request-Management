// components/dashboard/RoomLane.tsx — pieces of the room timeline: the hour scale and one lane per room.
import { formatRange, percentOfWindow } from '@/lib/dashboardTime';
import type { DayWindow, RoomStatus } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';

// room-name column, and the matching offset for the "now" line (column + gap + padding)
export const COLUMNS = 'grid-cols-[5.5rem_1fr] sm:grid-cols-[7rem_1fr]';
export const NOW_OFFSET = 'left-[calc(5.5rem+0.75rem+1rem)] sm:left-[calc(7rem+0.75rem+1rem)]';

/** Faint vertical line at each hour, drawn as a background so it costs no elements. */
const hourLines = (hours: number) => ({
  backgroundImage: 'linear-gradient(to right, rgb(128 134 139 / 0.18) 1px, transparent 1px)',
  backgroundSize: `${100 / hours}% 100%`,
});

export function Lane({ room, window, hours }: { room: RoomStatus; window: DayWindow; hours: number }) {
  const booked = room.busy.map((b) => formatRange(b.start, b.end)).join(', ') || 'nothing booked';
  return (
    <li className={`grid ${COLUMNS} items-center gap-3 px-4 py-2`}>
      <span className="truncate text-sm">
        {room.name}
        {room.inUseNow && <span className="sr-only"> (in use now)</span>}
      </span>
      <div className="relative h-6 rounded-sm bg-vl-canvas dark:bg-vl-surface-2" style={hourLines(hours)} role="img" aria-label={`${room.name}: ${booked}`}>
        {room.busy.map((b) => {
          const left = percentOfWindow(b.start, window);
          return (
            <span
              key={b.start}
              className="absolute inset-y-1 rounded-sm bg-vl-accent/80"
              style={{ left: `${left}%`, width: `${Math.max(0.5, percentOfWindow(b.end, window) - left)}%` }}
            />
          );
        })}
      </div>
    </li>
  );
}

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
