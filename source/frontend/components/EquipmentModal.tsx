// components/EquipmentModal.tsx the pop-up used to add a new equipment item or edit an existing one.
// The pieces live in components/equipment/, hooks/equipment/ and lib/equipment*.ts.
'use client';

import { useId, useRef } from 'react';
import { EquipmentDialogFrame } from '@/components/equipment/EquipmentDialogFrame';
import { EquipmentModalBody } from '@/components/equipment/EquipmentModalBody';
import { EquipmentModalFooter } from '@/components/equipment/EquipmentModalFooter';
import { EquipmentModalHeader } from '@/components/equipment/EquipmentModalHeader';
import { useEquipmentModal } from '@/hooks/equipment/useEquipmentModal';
import type { Equipment } from '@/lib/equipment';

type Props = {
  /** the item to edit, or null to add a new one */
  item: Equipment | null;
  onClose: () => void;
  /** called after a successful save; `notice` is the message the page shows */
  onSaved: (notice: string) => void;
};

export function EquipmentModal({ item, onClose, onSaved }: Props) {
  const isEdit = item !== null;
  const titleId = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const { form, photo, formError, saving, dirty, onSubmit, requestClose } = useEquipmentModal({ item, nameRef, onClose, onSaved });

  return (
    <EquipmentDialogFrame titleId={titleId} onBackdropClick={requestClose}>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
        <EquipmentModalHeader titleId={titleId} isEdit={isEdit} onClose={requestClose} />
        <EquipmentModalBody item={item} form={form} photo={photo} nameRef={nameRef} formError={formError} />
        <EquipmentModalFooter saving={saving} isEdit={isEdit} dirty={dirty} onCancel={requestClose} />
      </form>
    </EquipmentDialogFrame>
  );
}