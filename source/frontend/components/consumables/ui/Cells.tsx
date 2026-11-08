// components/consumables/ui/Cells.tsx — stock bar, expiry date and hazard symbols, shared by the table, cards and drawer.
import { expiryNote, expiryStatus, fmtNum, formatDate, stockPercent, stockStatus, type Consumable, type Hazard } from '@/lib/consumables';
import { ui } from '@/lib/ui';

const BAR_COLOURS = { out: 'bg-red-500', low: 'bg-amber-500', in: 'bg-emerald-500' };

export function StockCell({ c }: { c: Consumable }) {
  return (
    <div className="min-w-[150px]">
      <div className="flex items-baseline gap-1">
        <span className="font-medium tabular-nums">{fmtNum(c.currentStock)}</span>
        <span className={`text-xs ${ui.muted}`}>{c.unit}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#e8eaed] dark:bg-vl-line">
        <div className={`h-1.5 rounded-full ${BAR_COLOURS[stockStatus(c)]}`} style={{ width: `${stockPercent(c)}%` }} />
      </div>
      <div className={`mt-1 text-[11px] ${ui.muted}`}>
        Reorder at {fmtNum(c.reorderThreshold)} {c.unit}
      </div>
    </div>
  );
}

const NOTE_COLOURS = {
  expired: 'font-medium text-red-600 dark:text-red-400',
  soon: 'font-medium text-amber-700 dark:text-amber-400',
  ok: ui.muted,
  none: ui.muted,
};

export function ExpiryCell({ c }: { c: Consumable }) {
  if (!c.expiryDate) return <span className={`text-sm ${ui.muted}`}>No expiry</span>;
  return (
    <div className="whitespace-nowrap">
      <div className="text-sm">{formatDate(c.expiryDate)}</div>
      <div className={`text-xs ${NOTE_COLOURS[expiryStatus(c)]}`}>{expiryNote(c.expiryDate)}</div>
    </div>
  );
}

/** Red GHS-style diamond with the last two digits of the code, or "!" for a hazard without a code. */
export function HazardDiamond({ code }: { code: string | null }) {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center">
      <span className="grid h-[17px] w-[17px] rotate-45 place-items-center border-2 border-red-600 bg-white">
        <span className="-rotate-45 text-[8px] font-bold leading-none text-gray-900">{code ? code.slice(-2) : '!'}</span>
      </span>
    </span>
  );
}

export const hazardLabel = (h: Hazard) => (h.code ? `${h.code} ${h.name}` : h.name);

export function HazardPills({ hazards, max = 3 }: { hazards: Hazard[]; max?: number }) {
  if (!hazards.length) return <span className={`text-sm ${ui.muted}`}>—</span>;
  const extra = hazards.length - max;
  return (
    <div className="flex items-center" title={hazards.map(hazardLabel).join(', ')}>
      {hazards.slice(0, max).map((h) => (
        <HazardDiamond key={h.hazardId} code={h.code} />
      ))}
      {extra > 0 && <span className={`ml-1 text-xs ${ui.muted}`}>+{extra}</span>}
    </div>
  );
}
