// components/dashboard/RoomTimeline.tsx — rooms × hours for today's lab day: one lane per room, booked time filled,
// a thin blue line at "now". The faint hour lines are the only grid on the dashboard: they sit where something is measured.
// Only times come from the server, never who booked.
import { percentOfWindow, windowHours } from '@/lib/dashboardTime';
import type { Dashboard, DayWindow } from '@/lib/dashboardTypes';
import { HourScale, Lane, NOW_OFFSET } from './RoomLane';
import { EmptyLine, Section } from './Section';

type RoomSummary = Dashboard['lab']['rooms'];

export function RoomTimeline({ rooms, window, now = new Date() }: { rooms: RoomSummary; window: DayWindow; now?: Date }) {
  const labels = windowHours(window);
  const nowPercent = percentOfWindow(now.toISOString(), window);
  const showNow = now > window.from && now < window.to;

  return (
    <Section title="Rooms today" href="/rooms">
      {rooms.rooms.length === 0 ? (
        <EmptyLine>No rooms have been added yet.</EmptyLine>
      ) : (
        <div className="relative">
          <HourScale labels={labels} />
          <ul className="py-1">
            {rooms.rooms.map((room) => (
              <Lane key={room.roomId} room={room} window={window} hours={labels.length} />
            ))}
          </ul>
          {showNow && (
            <div className={`pointer-events-none absolute inset-y-0 right-4 ${NOW_OFFSET}`} aria-hidden>
              <span className="absolute inset-y-0 w-px bg-[#1558b0] dark:bg-[#a8c7fa]" style={{ left: `${nowPercent}%` }} />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
