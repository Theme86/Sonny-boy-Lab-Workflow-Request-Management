// components/consumables/detail/DeleteDialog.tsx — asks for confirmation before a consumable is deleted.
import { useState } from 'react';
import type { Consumable } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import { Icon } from '../ui/icons';
import { Modal } from '../ui/Modal';
import { btn } from '../ui/styles';

type Props = { item: Consumable; onCancel: () => void; onConfirm: () => Promise<void> };

export function DeleteDialog({ item, onCancel, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal
      size="sm"
      title="Delete consumable?"
      onClose={onCancel}
      footer={
        <>
          <button type="button" className={btn.secondary} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className={btn.danger} onClick={confirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
          <Icon name="alert" className="h-5 w-5" />
        </span>
        <p className={`text-sm ${ui.muted}`}>
          <span className="font-medium text-vl-ink">{item.name}</span> will be permanently removed from the inventory. This can&apos;t be undone.
        </p>
      </div>
    </Modal>
  );
}
