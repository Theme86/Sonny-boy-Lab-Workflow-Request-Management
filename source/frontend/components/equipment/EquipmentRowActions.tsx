// components/equipment/EquipmentRowActions.tsx — the Edit and Delete buttons of one item (lab managers only).
import { DeleteIcon, EditIcon } from '@/components/equipmentIcons';
import type { Equipment } from '@/lib/equipment';
import type { RowTools } from '@/lib/equipmentList';
import { ui } from '@/lib/ui';

type Props = { item: Equipment; tools: RowTools };

export function EquipmentRowActions({ item, tools }: Props) {
  if (!tools.canManage) return null;
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => tools.onEdit(item)}
        className={`${ui.btnText} h-9 gap-1.5 px-3`}
        aria-label={`Edit ${item.name}`}
      >
        <EditIcon width={18} height={18} />
        Edit
      </button>
      <button
        type="button"
        onClick={() => tools.onDelete(item)}
        disabled={tools.busyId === item.equipmentId}
        className={`${ui.btnDanger} gap-1.5`}
        aria-label={`Delete ${item.name}`}
      >
        <DeleteIcon width={18} height={18} />
        Delete
      </button>
    </div>
  );
}