// components/dashboard/StockWatch.tsx — consumables at or under their reorder level, and ones expired or expiring
// within 30 days. Amounts are written "left / reorder level unit" with a space before the unit.
import type { Dashboard } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { EmptyLine, Section } from './Section';
import { expiryText, Row, stockText } from './StockRow';

type ConsumableSummary = Dashboard['lab']['consumables'];

export { expiryText, stockText };

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
