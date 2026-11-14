// components/equipment/EquipmentList.tsx — the equipment page content: heading, cards, filters, list, pop-ups.
import { EquipmentStats } from '@/components/EquipmentStats';
import { useEquipmentPage } from '@/hooks/equipment/useEquipmentPage';
import { ui } from '@/lib/ui';
import { EquipmentCards } from './EquipmentCards';
import { EquipmentDialogs } from './EquipmentDialogs';
import { EquipmentEmptyState } from './EquipmentEmptyState';
import { EquipmentFilters } from './EquipmentFilters';
import { EquipmentHeading } from './EquipmentHeading';
import { EquipmentNotice } from './EquipmentNotice';
import { EquipmentPager } from './EquipmentPager';
import { EquipmentTable } from './EquipmentTable';

export function EquipmentList() {
  const page = useEquipmentPage();
  const { filters, data, loading, tools } = page;
  return (
    <div>
      <EquipmentHeading canManage={page.canManage} onAdd={page.dialogs.openAdd} />
      <EquipmentStats summary={page.summary} />
      <div className={`overflow-hidden ${ui.card}`}>
        <EquipmentFilters filters={filters} />
        {page.error && (
          <p role="alert" className="m-4 rounded-lg bg-[#fce8e6] px-4 py-3 text-sm text-[#8c1d18] dark:bg-[#601410] dark:text-[#f9dedc]">
            {page.error}
          </p>
        )}
        <EquipmentCards items={data?.items} loading={loading} tools={tools} />
        <EquipmentTable items={data?.items} loading={loading} tools={tools} />
        <EquipmentEmptyState data={data} loading={loading} filtered={!!filters.q || filters.onlyAvailable} canManage={page.canManage} />
        <EquipmentPager data={data} page={filters.page} loading={loading} onPage={filters.setPage} />
      </div>
      <EquipmentDialogs page={page} />
      <EquipmentNotice notice={page.notice} onDismiss={() => page.setNotice('')} />
    </div>
  );
}