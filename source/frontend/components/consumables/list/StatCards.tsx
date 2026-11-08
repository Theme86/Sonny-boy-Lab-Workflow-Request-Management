// components/consumables/list/StatCards.tsx — the four summary cards; each one also filters the list.
import type { StatusFilter } from '@/lib/consumableFilters';
import { EXPIRY_SOON_DAYS } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import { Icon, type IconName } from '../ui/icons';

const TONES = {
  gray: 'bg-vl-hover text-vl-muted',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
};

type CardProps = { label: string; value: number; icon: IconName; tone: keyof typeof TONES; active: boolean; onClick: () => void };

function StatCard({ label, value, icon, tone, active, onClick }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-4 p-4 text-left transition ${ui.card} ${ui.focus} ${active ? 'ring-2 ring-vl-accent' : ''}`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${TONES[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-2xl font-semibold tabular-nums">{value}</span>
        <span className={`block text-xs ${ui.muted}`}>{label}</span>
      </span>
    </button>
  );
}

type Stats = { total: number; low: number; soon: number; expired: number };
type Props = { stats: Stats; status: StatusFilter; onShowAll: () => void; onToggle: (s: StatusFilter) => void };

export function StatCards({ stats, status, onShowAll, onToggle }: Props) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <StatCard label="Total items" value={stats.total} icon="package" tone="gray" active={status === 'all'} onClick={onShowAll} />
      <StatCard label="Low / out of stock" value={stats.low} icon="alert" tone="amber" active={status === 'low'} onClick={() => onToggle('low')} />
      <StatCard
        label={`Expiring ≤ ${EXPIRY_SOON_DAYS} days`}
        value={stats.soon}
        icon="clock"
        tone="amber"
        active={status === 'soon'}
        onClick={() => onToggle('soon')}
      />
      <StatCard label="Expired" value={stats.expired} icon="ban" tone="red" active={status === 'expired'} onClick={() => onToggle('expired')} />
    </div>
  );
}
