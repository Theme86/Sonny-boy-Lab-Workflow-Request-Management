// components/equipment/EquipmentTable.tsx — tablets and up: a table.
import type { Equipment } from '@/lib/equipment';
import type { RowTools } from '@/lib/equipmentList';
import { EquipmentTableHead } from './EquipmentTableHead';
import { EquipmentTableRow } from './EquipmentTableRow';

type Props = { items: Equipment[] | undefined; loading: boolean; tools: RowTools };

export function EquipmentTable({ items, loading, tools }: Props) {
  return (
    <table className="hidden w-full table-auto text-left text-sm md:table">
      <EquipmentTableHead />
      <tbody className={loading ? 'opacity-60' : ''}>
        {items?.map((item) => (
          <EquipmentTableRow key={item.equipmentId} item={item} tools={tools} />
        ))}
      </tbody>
    </table>
  );
}