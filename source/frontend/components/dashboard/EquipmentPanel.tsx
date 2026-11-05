// components/dashboard/EquipmentPanel.tsx — how much equipment is free, and which kinds are all in use.
import type { Dashboard } from '@/lib/dashboardTypes';
import { ui } from '@/lib/ui';
import { EmptyNote, Panel } from './Panel';
import { Readout } from './Readout';

type EquipmentSummary = Dashboard['lab']['equipment'];

export function EquipmentPanel({ equipment }: { equipment: EquipmentSummary }) {
  return (
    <Panel label="Equipment" href="/equipment">
      {equipment.kinds === 0 ? (
        <EmptyNote>No equipment has been added yet.</EmptyNote>
      ) : (
        <div className="flex flex-col gap-4">
          <Readout value={`${equipment.unitsAvailable} / ${equipment.unitsTotal}`} label="units available" tone={equipment.unitsAvailable > 0 ? 'ok' : 'alert'} />
          {equipment.allTaken.total > 0 && (
            <p className={`text-sm ${ui.muted}`}>
              All in use: {equipment.allTaken.items.map((e) => e.name).join(', ')}
              {equipment.allTaken.total > equipment.allTaken.items.length && ` and ${equipment.allTaken.total - equipment.allTaken.items.length} more`}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
