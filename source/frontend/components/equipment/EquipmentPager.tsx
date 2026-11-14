// components/equipment/EquipmentPager.tsx — "1–10 of 25" with the previous and next buttons.
import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import type { EquipmentListResponse } from '@/lib/equipment';
import { PAGE_SIZE } from '@/lib/equipmentList';
import { ui } from '@/lib/ui';

type Props = { data: EquipmentListResponse | null; page: number; loading: boolean; onPage: Dispatch<SetStateAction<number>> };

export function EquipmentPager({ data, page, loading, onPage }: Props) {
  if (!data || data.total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const first = (data.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(data.page * PAGE_SIZE, data.total);
  const arrow = `rounded-full p-2 disabled:opacity-40 ${ui.hover} ${ui.focus}`;
  return (
    <div className={`flex items-center justify-end gap-2 border-t px-4 py-2 text-sm ${ui.border} ${ui.muted}`}>
      <span className="mr-2">
        {first}–{last} of {data.total}
      </span>
      <button type="button" aria-label="Previous page" className={arrow} disabled={page <= 1 || loading} onClick={() => onPage((p) => p - 1)}>
        <ChevronLeftIcon />
      </button>
      <button type="button" aria-label="Next page" className={arrow} disabled={page >= totalPages || loading} onClick={() => onPage((p) => p + 1)}>
        <ChevronRightIcon />
      </button>
    </div>
  );
}