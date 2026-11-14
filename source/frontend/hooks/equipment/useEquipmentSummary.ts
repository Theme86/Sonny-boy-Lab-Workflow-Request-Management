// hooks/equipment/useEquipmentSummary.ts — loads the numbers for the cards above the table.
import { useEffect, useState } from 'react';
import type { EquipmentSummary } from '@/components/EquipmentStats';
import { apiFetch } from '@/lib/api';

// the cards cover all equipment, so they only reload after a save or delete
export function useEquipmentSummary(reloadCount: number) {
  const [summary, setSummary] = useState<EquipmentSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiFetch<EquipmentSummary>('/api/equipment/summary')
      .then((data) => !cancelled && setSummary(data))
      .catch(() => {}); // if this fails the cards keep showing a dash, the table still works
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);
  return summary;
}