// components/consumables/list/Toolbar.tsx — search box, unit / status / sort dropdowns and the table/grid switch.
import type { Filters, SortKey, StatusFilter } from '@/lib/consumableFilters';
import { ui } from '@/lib/ui';
import { Icon } from '../ui/icons';
import { inputClass, selectCls } from '../ui/styles';

export type View = 'table' | 'grid';

type Props = {
  filters: Filters;
  units: string[];
  view: View;
  onChange: (change: Partial<Filters>) => void;
  onView: (v: View) => void;
};

function ViewSwitch({ view, onView }: Pick<Props, 'view' | 'onView'>) {
  return (
    <div className={`inline-flex rounded-full border p-0.5 ${ui.border}`} role="group" aria-label="View">
      {(['table', 'grid'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          title={v === 'table' ? 'Table view' : 'Grid view'}
          onClick={() => onView(v)}
          className={`grid h-8 w-8 place-items-center rounded-full transition ${
            view === v ? 'bg-vl-accent text-white dark:text-vl-on-accent' : `${ui.muted} ${ui.hover}`
          }`}
        >
          <Icon name={v === 'table' ? 'list' : 'grid'} />
        </button>
      ))}
    </div>
  );
}

export function Toolbar({ filters, units, view, onChange, onView }: Props) {
  return (
    <div className={`flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between ${ui.border}`}>
      <div className="relative w-full lg:max-w-sm">
        <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${ui.muted}`}>
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder="Search by name or description…"
          className={`${inputClass()} !pl-9`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Filter by unit" value={filters.unit} onChange={(e) => onChange({ unit: e.target.value })} className={selectCls}>
          <option value="all">All units</option>
          {units.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as StatusFilter })}
          className={selectCls}
        >
          <option value="all">All statuses</option>
          <option value="low">Low / out of stock</option>
          <option value="soon">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
        <select aria-label="Sort" value={filters.sort} onChange={(e) => onChange({ sort: e.target.value as SortKey })} className={selectCls}>
          <option value="name">Sort: Name</option>
          <option value="stock">Sort: Stock level</option>
          <option value="expiry">Sort: Expiry date</option>
        </select>
        <ViewSwitch view={view} onView={onView} />
      </div>
    </div>
  );
}
