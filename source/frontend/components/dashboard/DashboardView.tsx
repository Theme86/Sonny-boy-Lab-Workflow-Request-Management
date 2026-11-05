// components/dashboard/DashboardView.tsx — the layout: a readout strip, then the lab (wide column) beside your own work
// (narrow column). On small screens your own work comes first. Which cards appear follows what the server sent.
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';
import { AttentionPanel } from './AttentionPanel';
import { ConsumablesPanel } from './ConsumablesPanel';
import { EquipmentPanel } from './EquipmentPanel';
import { NextSessionPanel } from './NextSessionPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { RequestsPanel } from './RequestsPanel';
import { RoomsTimeline } from './RoomsTimeline';
import { SummaryStrip } from './SummaryStrip';

export function DashboardView({ data, window }: { data: Dashboard; window: DayWindow }) {
  const { me, lab, attention } = data;
  return (
    <div className="flex flex-col gap-4">
      <SummaryStrip data={data} />
      {attention && <AttentionPanel attention={attention} />}
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:order-2 lg:col-span-4">
          <NextSessionPanel session={me.nextSession} />
          <RequestsPanel requests={me.requests} />
          <NotificationsPanel notifications={me.notifications} />
        </div>
        <div className="flex flex-col gap-4 lg:order-1 lg:col-span-8">
          <RoomsTimeline rooms={lab.rooms} window={window} />
          <EquipmentPanel equipment={lab.equipment} />
          <ConsumablesPanel consumables={lab.consumables} />
        </div>
      </div>
    </div>
  );
}
