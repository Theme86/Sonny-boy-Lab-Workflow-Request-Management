// components/dashboard/RoomStrip.tsx — one room's day as a strip: filled where it is booked, a marker for now.
import { formatRange, percentOfWindow } from '@/lib/dashboardTime';
import type { DayWindow, RoomStatus } from '@/lib/dashboardTypes';
import { ui } from '@/lib/ui';
import { TONE_DOT } from './tones';

export function RoomStrip({ room, window, nowPercent }: { room: RoomStatus; window: DayWindow; nowPercent: number }) {
  return (
    <li>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${TONE_DOT[room.inUseNow ? 'warn' : 'ok']}`} aria-hidden />
          {room.name}
        </span>
        <span className={`text-xs ${ui.muted}`}>{room.inUseNow ? 'In use now' : 'Free now'}</span>
      </div>
      <div className="relative h-3 rounded-sm bg-[#80868b]/15" role="img" aria-label={`${room.name} bookings today: ${room.busy.map((b) => formatRange(b.start, b.end)).join(', ') || 'none'}`}>
        {[25, 50, 75].map((tick) => (
          <span key={tick} className="absolute inset-y-0 w-px bg-[#80868b]/25" style={{ left: `${tick}%` }} aria-hidden />
        ))}
        {room.busy.map((b) => {
          const left = percentOfWindow(b.start, window);
          return <span key={b.start} className="absolute inset-y-0 rounded-sm bg-[#1558b0] dark:bg-[#a8c7fa]" style={{ left: `${left}%`, width: `${percentOfWindow(b.end, window) - left}%` }} />;
        })}
        <span className="absolute -inset-y-1 w-px bg-[#e94235] dark:bg-[#ff8a80]" style={{ left: `${nowPercent}%` }} aria-hidden />
      </div>
    </li>
  );
}
