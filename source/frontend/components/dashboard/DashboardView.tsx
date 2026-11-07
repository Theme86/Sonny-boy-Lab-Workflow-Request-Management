// components/dashboard/DashboardView.tsx — the layout: a status line, then a wide main column of work queues
// (ordered per role, see sectionOrder.ts) beside a narrow column of notifications and lab stock.
import type { Dashboard, DayWindow } from '@/lib/dashboardTypes';
import { EquipmentNote } from './EquipmentNote';
import { Notifications } from './Notifications';
import { MAIN_SECTIONS } from './mainRenderers';
import { NewMembers } from './NewMembers';
import { mainSections } from './sectionOrder';
import { StatusLine } from './StatusLine';
import { StockWatch } from './StockWatch';

export function DashboardView({ data, window }: { data: Dashboard; window: DayWindow }) {
  const newMembers = data.attention?.newMembers;
  return (
    <div className="flex flex-col gap-6">
      <StatusLine data={data} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {mainSections(data.role).map((key) => (
            <div key={key} className="empty:hidden">
              {MAIN_SECTIONS[key](data, window)}
            </div>
          ))}
        </div>
        <aside className="flex flex-col gap-6" aria-label="Lab and notifications">
          <Notifications notifications={data.me.notifications} />
          <StockWatch consumables={data.lab.consumables} />
          <EquipmentNote equipment={data.lab.equipment} />
          {newMembers !== undefined && newMembers > 0 && <NewMembers count={newMembers} />}
        </aside>
      </div>
    </div>
  );
}
