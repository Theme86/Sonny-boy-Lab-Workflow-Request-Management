// components/equipment/EquipmentModalFooter.tsx — the Cancel and Save buttons of the pop-up.
import { ui } from '@/lib/ui';

type Props = { saving: boolean; isEdit: boolean; dirty: boolean; onCancel: () => void };

export function EquipmentModalFooter({ saving, isEdit, dirty, onCancel }: Props) {
  return (
    <div className={`flex items-center justify-end gap-2 border-t px-6 py-4 ${ui.border}`}>
      <button type="button" className={ui.btnText} onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      <button type="submit" className={ui.btnPrimary} disabled={saving || (isEdit && !dirty)}>
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add equipment'}
      </button>
    </div>
  );
}