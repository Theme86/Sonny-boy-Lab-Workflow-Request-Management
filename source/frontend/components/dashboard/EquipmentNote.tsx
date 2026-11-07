// components/dashboard/EquipmentNote.tsx — which kinds of equipment have no unit free right now.
import type { Dashboard } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';

type EquipmentSummary = Dashboard['lab']['equipment'];

function message({ kinds, allTaken }: EquipmentSummary) {
  if (kinds === 0) return 'No equipment has been added yet.';
  if (allTaken.total === 0) return 'Every kind of equipment has at least one unit free.';
  return null;
}

export function EquipmentNote({ equipment }: { equipment: EquipmentSummary }) {
  const text = message(equipment);
  const more = equipment.allTaken.total - equipment.allTaken.items.length;
  return (
    <Section title="Fully booked equipment" count={equipment.allTaken.total || undefined} href="/equipment">
      {text ? (
        <EmptyLine>{text}</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {equipment.allTaken.items.map((e) => (
            <li key={e.equipmentId} className="px-4 py-2.5 text-sm">
              {e.name}
            </li>
          ))}
          {more > 0 && <li className={`px-4 py-2.5 text-sm ${dash.muted}`}>and {more} more</li>}
        </ul>
      )}
    </Section>
  );
}
