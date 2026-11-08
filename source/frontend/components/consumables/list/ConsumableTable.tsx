// components/consumables/list/ConsumableTable.tsx — table view; clicking a row opens the detail drawer.
import type { Consumable } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import type { ItemActions } from '../actions';
import { StockBadge } from '../ui/Badges';
import { ExpiryCell, HazardPills, StockCell } from '../ui/Cells';
import { IconButton } from '../ui/icons';
import { Thumb } from '../ui/Thumb';

const COLUMNS = ['Consumable', 'Stock', 'pH', 'Expiry', 'Hazards', 'Status'];

function Row({ c, actions }: { c: Consumable; actions: ItemActions }) {
  return (
    <tr onClick={() => actions.onOpen(c)} className={`cursor-pointer border-t transition ${ui.border} ${ui.hover}`}>
      <td className="py-3 pl-6 pr-4">
        <div className="flex items-center gap-3">
          <Thumb src={c.imageUrl} alt={c.name} onClick={() => actions.onImage(c)} />
          <div className="min-w-0">
            <div className="font-medium">{c.name}</div>
            <div className={`max-w-[260px] truncate text-xs ${ui.muted}`}>{c.description ?? '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><StockCell c={c} /></td>
      <td className="px-4 py-3 tabular-nums">{c.phValue != null ? c.phValue.toFixed(2) : <span className={ui.muted}>—</span>}</td>
      <td className="px-4 py-3"><ExpiryCell c={c} /></td>
      <td className="px-4 py-3"><HazardPills hazards={c.hazards} /></td>
      <td className="px-4 py-3"><StockBadge c={c} /></td>
      <td className="py-3 pl-4 pr-6">
        <div className="flex justify-end gap-0.5">
          <IconButton icon="eye" label="View details" onClick={() => actions.onOpen(c)} />
          {actions.canManage && (
            <>
              <IconButton icon="pencil" label="Edit" onClick={() => actions.onEdit(c)} />
              <IconButton icon="trash" label="Delete" danger onClick={() => actions.onDelete(c)} />
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export function ConsumableTable({ items, actions }: { items: Consumable[]; actions: ItemActions }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-vl-hover">
          <tr>
            {COLUMNS.map((h) => (
              <th key={h} scope="col" className={`whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide first:pl-6 ${ui.muted}`}>
                {h}
              </th>
            ))}
            <th scope="col" className="px-4 py-3 pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <Row key={c.consumableId} c={c} actions={actions} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
