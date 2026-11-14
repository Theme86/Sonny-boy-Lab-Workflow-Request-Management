// components/equipment/EquipmentSelects.tsx — the "All equipment / Available now" and the sort drop-downs.
import type { EquipmentFilters } from '@/hooks/equipment/useEquipmentFilters';
import { SORT_OPTIONS, type SortValue } from '@/lib/equipmentList';
import { ui } from '@/lib/ui';

export function EquipmentSelects({ filters }: { filters: EquipmentFilters }) {
  return (
    <>
      <select
        value={filters.onlyAvailable ? 'available' : 'all'}
        onChange={(e) => filters.changeAvailability(e.target.value === 'available')}
        className={`${ui.select} sm:w-48`}
        aria-label="Filter by availability"
      >
        <option value="all">All equipment</option>
        <option value="available">Available now</option>
      </select>
      <select
        value={filters.sort}
        onChange={(e) => filters.changeSort(e.target.value as SortValue)}
        className={`${ui.select} sm:w-48`}
        aria-label="Sort equipment"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>
    </>
  );
}