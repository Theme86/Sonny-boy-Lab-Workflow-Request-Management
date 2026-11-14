// hooks/equipment/useEquipmentPage.ts — all the state of the equipment page, put together.
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { RowTools } from '@/lib/equipmentList';
import { useEquipmentData } from './useEquipmentData';
import { useEquipmentDelete } from './useEquipmentDelete';
import { useEquipmentDialogs } from './useEquipmentDialogs';
import { useEquipmentFilters } from './useEquipmentFilters';
import { useEquipmentSummary } from './useEquipmentSummary';
import { useNotice } from './useNotice';

export function useEquipmentPage() {
  const { user } = useCurrentUser();
  const canManage = user?.role === 'lab_manager';

  const filters = useEquipmentFilters();
  const [reloadCount, setReloadCount] = useState(0);
  const { data, loading, error } = useEquipmentData(filters.query, reloadCount);
  const summary = useEquipmentSummary(reloadCount);
  const [notice, setNotice] = useNotice();
  const dialogs = useEquipmentDialogs();

  const reload = () => setReloadCount((n) => n + 1);
  const { busyId, handleDelete } = useEquipmentDelete({ data, page: filters.page, setPage: filters.setPage, reload, setNotice });

  function handleSaved(message: string) {
    if (dialogs.modal.mode === 'add') filters.resetFilters();
    dialogs.closeModal();
    setNotice(message);
    reload();
  }

  const tools: RowTools = { canManage, busyId, onViewPhoto: dialogs.viewPhoto, onEdit: dialogs.openEdit, onDelete: handleDelete };

  return { canManage, filters, data, loading, error, summary, notice, setNotice, dialogs, handleSaved, tools };
}

export type EquipmentPageState = ReturnType<typeof useEquipmentPage>;