// components/equipment/EquipmentTableRow.tsx — one row of the table.
import type { Equipment } from '@/lib/equipment';
import type { RowTools } from '@/lib/equipmentList';
import { ui } from '@/lib/ui';
import { EquipmentNameBlock } from './EquipmentNameBlock';
import { EquipmentRowActions } from './EquipmentRowActions';
import { EquipmentStockBadge } from './EquipmentStockBadge';

type Props = { item: Equipment; tools: RowTools };

export function EquipmentTableRow({ item, tools }: Props) {
  return (
    <tr className={`border-b last:border-b-0 ${ui.border} hover:bg-vl-hover`}>
      <td className="w-full max-w-0 px-4 py-3">
        <EquipmentNameBlock item={item} onViewPhoto={tools.onViewPhoto} />
        <p className={`mt-1 pl-20 text-xs lg:hidden ${ui.muted}`}>{item.location || 'No location set'}</p>
      </td>
      <td className={`hidden px-4 py-3 lg:table-cell ${ui.muted}`}>
        <span className="block max-w-[13rem] truncate" title={item.location ?? undefined}>
          {item.location || '-'}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <EquipmentStockBadge item={item} />
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <EquipmentRowActions item={item} tools={tools} />
      </td>
    </tr>
  );
}