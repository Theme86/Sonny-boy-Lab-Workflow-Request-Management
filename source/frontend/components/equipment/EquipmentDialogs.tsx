// components/equipment/EquipmentDialogs.tsx — the add / edit pop-up and the large photo, when they are open.
import { EquipmentLightbox } from '@/components/EquipmentLightbox';
import { EquipmentModal } from '@/components/EquipmentModal';
import type { EquipmentPageState } from '@/hooks/equipment/useEquipmentPage';

type Props = { page: EquipmentPageState };

export function EquipmentDialogs({ page: { canManage, dialogs, handleSaved } }: Props) {
  const { modal, lightbox } = dialogs;
  return (
    <>
      {canManage && modal.mode !== 'closed' && (
        <EquipmentModal
          // a new key makes React start a fresh form when you open a different item
          key={modal.mode === 'edit' ? `edit-${modal.item.equipmentId}` : 'add'}
          item={modal.mode === 'edit' ? modal.item : null}
          onClose={dialogs.closeModal}
          onSaved={handleSaved}
        />
      )}
      {lightbox && <EquipmentLightbox src={lightbox.src} name={lightbox.name} onClose={dialogs.closeLightbox} />}
    </>
  );
}