// hooks/equipment/useEquipmentDialogs.ts — which pop-up is open: the add / edit form or the large photo.
import { useState } from 'react';
import { imageUrl } from '@/lib/api';
import type { Equipment } from '@/lib/equipment';
import type { LightboxState, ModalState } from '@/lib/equipmentList';

export function useEquipmentDialogs() {
  const [modal, setModal] = useState<ModalState>({ mode: 'closed' });
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  return {
    modal,
    lightbox,
    openAdd: () => setModal({ mode: 'add' }),
    openEdit: (item: Equipment) => setModal({ mode: 'edit', item }),
    closeModal: () => setModal({ mode: 'closed' }),
    viewPhoto: (item: Equipment) => setLightbox({ src: imageUrl(item.imageUrl) ?? '', name: item.name }),
    closeLightbox: () => setLightbox(null),
  };
}