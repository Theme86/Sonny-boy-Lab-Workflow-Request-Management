// components/equipment/EquipmentCards.tsx — phones: one card per item.
import type { Equipment } from '@/lib/equipment';
import type { RowTools } from '@/lib/equipmentList';
import { ui } from '@/lib/ui';
import { EquipmentNameBlock } from './EquipmentNameBlock';
import { EquipmentRowActions } from './EquipmentRowActions';
import { EquipmentStockBadge } from './EquipmentStockBadge';

type Props = { items: Equipment[] | undefined; loading: boolean; tools: RowTools };

export function EquipmentCards({ items, loading, tools }: Props) {
  return (
    <ul className={`md:hidden ${loading ? 'opacity-60' : ''}`}>
      {items?.map((item) => (
        <li key={item.equipmentId} className={`border-b px-4 py-4 last:border-b-0 ${ui.border}`}>
          <EquipmentNameBlock item={item} onViewPhoto={tools.onViewPhoto} />
          <div className="mt-3 space-y-1.5 text-sm">
            <EquipmentStockBadge item={item} />
            <p className={ui.muted}>{item.location || 'No location set'}</p>
          </div>
          {tools.canManage && (
            <div className="mt-2 -ml-3">
              <EquipmentRowActions item={item} tools={tools} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}