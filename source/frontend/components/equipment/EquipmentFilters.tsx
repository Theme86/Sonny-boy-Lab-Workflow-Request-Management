// components/equipment/EquipmentFilters.tsx — the bar above the list: search, filter and sort.
import type { EquipmentFilters as Filters } from '@/hooks/equipment/useEquipmentFilters';
import { ui } from '@/lib/ui';
import { EquipmentSearchBox } from './EquipmentSearchBox';
import { EquipmentSelects } from './EquipmentSelects';

export function EquipmentFilters({ filters }: { filters: Filters }) {
  return (
    <div className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center ${ui.border}`}>
      <EquipmentSearchBox value={filters.search} onChange={filters.changeSearch} />
      <EquipmentSelects filters={filters} />
    </div>
  );
}