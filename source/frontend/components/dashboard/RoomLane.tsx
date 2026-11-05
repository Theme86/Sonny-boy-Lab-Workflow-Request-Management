// components/dashboard/RoomLane.tsx — one lane per room on the timeline (the hour scale is in HourScale.tsx).
import { formatRange, percentOfWindow } from '@/lib/dashboardTime';
import type { DayWindow, RoomStatus } from '@/lib/dashboardTypes';
import { COLUMNS } from './roomGrid';

export { HourScale } from './HourScale';
export { COLUMNS, NOW_OFFSET } from './roomGrid';

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
