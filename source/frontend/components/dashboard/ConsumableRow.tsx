// components/dashboard/ConsumableRow.tsx — one line in the consumables card: name, hazards and a coloured detail.
import type { ReactNode } from 'react';
import { daysText } from '@/lib/dashboardTime';
import type { ConsumableItem } from '@/lib/dashboardTypes';
import { monoFamily } from '@/lib/fontStacks';
import { ui } from '@/lib/ui';
import { TONE_DOT, TONE_TEXT } from './tones';

export function ConsumableRow({ item, detail, tone }: { item: ConsumableItem; detail: string; tone: 'warn' | 'alert' }) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-sm">
      <span className="min-w-0">
        <span className={`mr-2 inline-block h-2 w-2 rounded-full ${TONE_DOT[tone]}`} aria-hidden />
        {item.name}
        {item.hazards.length > 0 && <span className={`ml-2 text-xs ${ui.muted}`}>{item.hazards.join(', ')}</span>}
      </span>
      <span className={`shrink-0 tabular-nums ${TONE_TEXT[tone]}`} style={{ fontFamily: monoFamily }}>
        {detail}
      </span>
    </li>
  );
}

export const stockDetail = (item: ConsumableItem) => `${item.currentStock} / ${item.reorderThreshold} ${item.unit}`;
export const expiryDetail = (item: ConsumableItem) => (item.expiry === 'expired' ? `expired ${daysText(item.daysLeft ?? 0)}` : `expires ${daysText(item.daysLeft ?? 0)}`);

/** A titled list of rows, e.g. "Running low 2". */
export function Group({ title, total, children }: { title: string; total: number; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">
        {title} <span className={`tabular-nums ${ui.muted}`}>{total}</span>
      </h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}
