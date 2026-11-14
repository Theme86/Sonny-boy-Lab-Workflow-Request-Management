// hooks/equipment/useEquipmentData.ts — loads one page of equipment.
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { EquipmentListResponse } from '@/lib/equipment';

export function useEquipmentData(query: string, reloadCount: number) {
  const [result, setResult] = useState<{ key: string; data?: EquipmentListResponse; error?: string } | null>(null);

  // reloadCount makes "reload after a save or delete" count as a new request
  const queryKey = `${query}|${reloadCount}`;

  useEffect(() => {
    let cancelled = false;
    apiFetch<EquipmentListResponse>(`/api/equipment?${query}`)
      .then((data) => !cancelled && setResult({ key: queryKey, data }))
      .catch((err) => !cancelled && setResult({ key: queryKey, error: err.message ?? 'Equipment could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [query, queryKey]);

  const loading = result?.key !== queryKey;
  const data = result?.data ?? null; // keeps showing the previous page while the next one loads
  const error = loading ? '' : (result?.error ?? '');
  return { data, loading, error };
}