// hooks/equipment/useEquipmentDelete.ts — the Delete button: ask, delete, then tell the page.
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Equipment, EquipmentListResponse } from '@/lib/equipment';

type Args = {
  data: EquipmentListResponse | null;
  page: number;
  setPage: (page: number) => void;
  reload: () => void;
  setNotice: (message: string) => void;
};

export function useEquipmentDelete({ data, page, setPage, reload, setNotice }: Args) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleDelete(item: Equipment) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setBusyId(item.equipmentId);
    try {
      // a successful DELETE answers 204 with no body; a blocked one (still used somewhere) answers 409 with a message
      await apiFetch<null>(`/api/equipment/${item.equipmentId}`, { method: 'DELETE' });
      setNotice(`${item.name} was deleted`);
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'The equipment could not be deleted');
    } finally {
      setBusyId(null);
    }
  }

  return { busyId, handleDelete };
}