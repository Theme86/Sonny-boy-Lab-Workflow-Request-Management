// components/equipment/EquipmentModalHeader.tsx — the title and the X button of the pop-up.
import { CloseIcon } from '@/components/equipmentIcons';
import { ui } from '@/lib/ui';

type Props = { titleId: string; isEdit: boolean; onClose: () => void };

export function EquipmentModalHeader({ titleId, isEdit, onClose }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2">
      <div>
        <h2 id={titleId} className="text-[22px] leading-7">
          {isEdit ? 'Edit equipment' : 'Add equipment'}
        </h2>
        <p className={`mt-1 text-sm ${ui.muted}`}>
          {isEdit ? 'Changes show up for everyone in the lab.' : 'Only the name is required.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={`-mt-1 -mr-2 rounded-full p-2 text-vl-muted ${ui.hover} ${ui.focus}`}
      >
        <CloseIcon />
      </button>
    </div>
  );
}