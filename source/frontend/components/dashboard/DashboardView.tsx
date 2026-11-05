// components/dashboard/DashboardView.tsx — the cards, laid out. Which cards appear follows what the server sent.
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';
import { AttentionPanel } from './AttentionPanel';
import { ConsumablesPanel } from './ConsumablesPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { NextSessionPanel } from './NextSessionPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { RequestsPanel } from './RequestsPanel';
import { RoomsTimeline } from './RoomsTimeline';

export function DashboardView({ data, window }: { data: Dashboard; window: DayWindow }) {
  const { me, lab, attention } = data;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {attention && <AttentionPanel attention={attention} />}
      <NextSessionPanel session={me.nextSession} />
      <RequestsPanel requests={me.requests} />
      <EquipmentPanel equipment={lab.equipment} />
      <RoomsTimeline rooms={lab.rooms} window={window} />
      <NotificationsPanel notifications={me.notifications} />
      <ConsumablesPanel consumables={lab.consumables} />
    </div>
  );
}
