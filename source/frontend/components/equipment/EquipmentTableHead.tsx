// components/equipment/EquipmentTableHead.tsx — the column titles of the table.
import { ui } from '@/lib/ui';

export function EquipmentTableHead() {
  return (
    <thead className={ui.muted}>
      <tr className={`border-b ${ui.border}`}>
        <th className="px-4 py-3 font-medium">Equipment</th>
        <th className="hidden px-4 py-3 font-medium lg:table-cell">Location</th>
        <th className="px-4 py-3 font-medium">Availability</th>
        <th className="px-4 py-3">
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}