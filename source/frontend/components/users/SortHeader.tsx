// components/users/SortHeader.tsx — a table heading you can click to sort by that column.
import { ui } from '@/lib/ui';
import type { SortKey } from './useUserQuery';

export type Sorting = { sort: SortKey; order: 'asc' | 'desc'; onSort: (key: SortKey) => void };

export function SortHeader({ label, sortKey, sorting, className = '' }: { label: string; sortKey: SortKey; sorting: Sorting; className?: string }) {
  const active = sorting.sort === sortKey;
  const ariaSort = active ? (sorting.order === 'asc' ? 'ascending' : 'descending') : undefined;
  return (
    <th className={`px-4 py-3 font-medium ${className}`} aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => sorting.onSort(sortKey)}
        className={`inline-flex items-center gap-1 rounded ${ui.focus} ${active ? 'text-vl-ink' : 'hover:text-vl-ink'}`}
      >
        {label}
        <span aria-hidden className={active ? '' : 'invisible'}>
          {sorting.order === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </th>
  );
}
