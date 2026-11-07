// components/dashboard/StockRow.tsx — one consumable in "Stock to check", with the text for its amount or expiry.
import { daysText } from '@/lib/dashboardTime';
import type { ConsumableItem } from '@/lib/dashboardTypes';
import { dash } from '@/lib/dashboardUi';
import { toneClass } from './StatusText';

export const stockText = (c: ConsumableItem) => `${c.currentStock} / ${c.reorderThreshold} ${c.unit}`;
export const expiryText = (c: ConsumableItem) => (c.expiry === 'expired' ? `expired ${daysText(c.daysLeft ?? 0)}` : `expires ${daysText(c.daysLeft ?? 0)}`);

export function Row({ item, detail, fault }: { item: ConsumableItem; detail: string; fault: boolean }) {
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
