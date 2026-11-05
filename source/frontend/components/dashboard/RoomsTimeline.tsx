// components/dashboard/RoomsTimeline.tsx — today for each room as a strip like a scope trace: filled where it is booked,
// with a marker for now. Only times are shown, never who booked.
import { percentOfWindow } from '@/lib/dashboardTime';
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';
import { RoomStrip } from './RoomStrip';

type RoomSummary = Dashboard['lab']['rooms'];
const HOURS = [0, 6, 12, 18, 24];

export function RoomsTimeline({ rooms, window, now = new Date() }: { rooms: RoomSummary; window: DayWindow; now?: Date }) {
  const nowPercent = percentOfWindow(now.toISOString(), window);

  return (
    <Panel label="Rooms today" channel="violet" href="/rooms">
      {rooms.rooms.length === 0 ? (
        <EmptyState art="flat" title="No rooms yet" body="Once rooms are added, today's bookings show here as a timeline." />
      ) : (
        <>
          <ul className="flex flex-col gap-4">
            {rooms.rooms.map((room) => (
              <RoomStrip key={room.roomId} room={room} window={window} nowPercent={nowPercent} />
            ))}
          </ul>
          <div className={`mt-3 flex justify-between text-[11px] tabular-nums ${ui.muted}`} style={{ fontFamily: monoFamily }} aria-hidden>
            {HOURS.map((h) => (
              <span key={h}>{String(h).padStart(2, '0')}</span>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}
