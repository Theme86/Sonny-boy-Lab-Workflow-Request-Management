// components/EquipmentStats.tsx — four summary cards above the equipment table.
// The numbers cover ALL equipment (not just the current page or search) and use the same
// green / amber / red colors as the availability badge in the table.
import { ui } from '@/lib/ui';

export type EquipmentSummary = {
  total: number;
  inStock: number;
  low: number;
  out: number;
};

const CARDS: { key: keyof EquipmentSummary; label: string; dot: string | null }[] = [
  { key: 'total', label: 'Total equipment', dot: null },
  { key: 'inStock', label: 'Available', dot: 'bg-[#1e8e3e]' },
  { key: 'low', label: 'Running low', dot: 'bg-[#f9ab00]' },
  { key: 'out', label: 'None available', dot: 'bg-[#b3261e]' },
];

export function EquipmentStats({ summary }: { summary: EquipmentSummary | null }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map((card) => (
        <div key={card.key} className={`px-4 py-3.5 ${ui.card}`}>
          <p className={`flex items-center gap-2 text-sm ${ui.muted}`}>
            {card.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${card.dot}`} aria-hidden />}
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{summary ? summary[card.key] : '–'}</p>
        </div>
      ))}
    </div>
  );
}