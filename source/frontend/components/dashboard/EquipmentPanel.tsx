// components/dashboard/EquipmentPanel.tsx — how much of the equipment is in use, as a bar, and which kinds are all taken.
// (The free/total number itself is in the readout strip, so it is not repeated here.)
import type { Dashboard } from '@/lib/dashboardTypes';
import { ui } from '@/lib/ui';
import { EmptyState } from './EmptyState';
import { Panel } from './Panel';
import { UsageBar } from './UsageBar';

type EquipmentSummary = Dashboard['lab']['equipment'];

function AllTaken({ allTaken }: { allTaken: EquipmentSummary['allTaken'] }) {
  if (allTaken.total === 0) return <p className={`text-sm ${ui.muted}`}>Every kind has at least one unit free.</p>;
  const more = allTaken.total - allTaken.items.length;
  return (
    <p className={`text-sm ${ui.muted}`}>
      All in use: {allTaken.items.map((e) => e.name).join(', ')}
      {more > 0 && ` and ${more} more`}
    </p>
  );
}

export function EquipmentPanel({ equipment }: { equipment: EquipmentSummary }) {
  return (
    <Panel label="Equipment" channel="teal" href="/equipment">
      {equipment.kinds === 0 ? (
        <EmptyState art="search" title="No equipment yet" body="The lab manager adds equipment on the Equipment page." />
      ) : (
        <div className="flex flex-col gap-4">
          <UsageBar used={equipment.unitsTotal - equipment.unitsAvailable} total={equipment.unitsTotal} />
          <AllTaken allTaken={equipment.allTaken} />
        </div>
      )}
    </Panel>
  );
}
