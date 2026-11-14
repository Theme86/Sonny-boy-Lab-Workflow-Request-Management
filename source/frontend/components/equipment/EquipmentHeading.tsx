// components/equipment/EquipmentHeading.tsx — the page title and the "Add equipment" button (lab managers only).
import { PlusIcon } from '@/components/equipmentIcons';
import { PageHeading } from '@/components/ProfileView';
import { ui } from '@/lib/ui';

type Props = { canManage: boolean; onAdd: () => void };

export function EquipmentHeading({ canManage, onAdd }: Props) {
  return (
    <PageHeading
      title="Equipment"
      subtitle="Everything the lab can lend out, with a photo, where to find it and how many are free right now."
      action={
        canManage && (
          <button type="button" onClick={onAdd} className={`${ui.btnPrimary} gap-2 pr-6 pl-5`}>
            <PlusIcon />
            Add equipment
          </button>
        )
      }
    />
  );
}