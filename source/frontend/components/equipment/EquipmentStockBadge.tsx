// components/equipment/EquipmentStockBadge.tsx — "3 of 8  Available" with a green / amber / red dot.
import { stockLevel, STOCK_LABELS, type Equipment, type Stock } from '@/lib/equipment';
import { ui } from '@/lib/ui';

const STOCK_DOT: Record<Stock, string> = {
  in: 'bg-[#1e8e3e]',
  low: 'bg-[#f9ab00]',
  out: 'bg-[#b3261e]',
};

export function EquipmentStockBadge({ item }: { item: Equipment }) {
  const level = stockLevel(item);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STOCK_DOT[level]}`} aria-hidden />
      <span>
        <span className="font-medium">
          {item.quantityAvailable} of {item.quantityTotal}
        </span>
        <span className={`ml-1.5 ${ui.muted}`}>{STOCK_LABELS[level]}</span>
      </span>
    </span>
  );
}