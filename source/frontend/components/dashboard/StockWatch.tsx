// components/dashboard/StockWatch.tsx — consumables at or under their reorder level, and ones expired or expiring
// within 30 days. Amounts are written "left / reorder level unit" with a space before the unit.
import { daysText } from '@/lib/dashboardTime';
import type { ConsumableItem, Dashboard } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';
import { toneClass } from './StatusText';

type ConsumableSummary = Dashboard['lab']['consumables'];

export const stockText = (c: ConsumableItem) => `${c.currentStock} / ${c.reorderThreshold} ${c.unit}`;
export const expiryText = (c: ConsumableItem) => (c.expiry === 'expired' ? `expired ${daysText(c.daysLeft ?? 0)}` : `expires ${daysText(c.daysLeft ?? 0)}`);

function Row({ item, detail, fault }: { item: ConsumableItem; detail: string; fault: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="min-w-0">
        <span className="block truncate">{item.name}</span>
        {item.hazards.length > 0 && <span className={`text-xs ${dash.muted}`}>{item.hazards.join(', ')}</span>}
      </span>
      <span className={`shrink-0 ${dash.num} ${toneClass(fault ? 'fault' : 'warn')}`}>{detail}</span>
    </li>
  );
}

function emptyMessage(total: number) {
  return total === 0 ? 'No consumables are tracked yet.' : `All ${total} consumables are above their reorder level and in date.`;
}

export function StockWatch({ consumables }: { consumables: ConsumableSummary }) {
  const { lowStock, expiring } = consumables;
  const flagged = lowStock.total + expiring.total;
  return (
    <Section title="Stock to check" count={flagged || undefined} href="/consumables">
      {flagged === 0 ? (
        <EmptyLine>{emptyMessage(consumables.total)}</EmptyLine>
      ) : (
        <ul className={dash.rows}>
          {lowStock.items.map((c) => (
            <Row key={`low-${c.consumableId}`} item={c} detail={stockText(c)} fault={c.currentStock === 0} />
          ))}
          {expiring.items.map((c) => (
            <Row key={`exp-${c.consumableId}`} item={c} detail={expiryText(c)} fault={c.expiry === 'expired'} />
          ))}
        </ul>
      )}
    </Section>
  );
}
