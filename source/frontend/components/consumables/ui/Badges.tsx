// components/consumables/ui/Badges.tsx — the stock and expiry status pills.
import type { ReactNode } from 'react';
import { daysUntil, expiryStatus, stockStatus, type Consumable } from '@/lib/consumables';
import { Icon } from './icons';

type Tone = 'green' | 'amber' | 'red';
const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/10 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
};

function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}

const Dot = ({ className }: { className: string }) => <span className={`h-1.5 w-1.5 rounded-full ${className}`} />;

export function StockBadge({ c }: { c: Consumable }) {
  const s = stockStatus(c);
  if (s === 'out') return <Badge tone="red"><Dot className="bg-red-500" />Out of stock</Badge>;
  if (s === 'low') return <Badge tone="amber"><Dot className="bg-amber-500" />Low stock</Badge>;
  return <Badge tone="green"><Dot className="bg-emerald-500" />In stock</Badge>;
}

export function ExpiryBadge({ c }: { c: Consumable }) {
  const s = expiryStatus(c);
  if (!c.expiryDate || s === 'none' || s === 'ok') return null;
  if (s === 'expired') return <Badge tone="red"><Icon name="ban" className="h-3 w-3" />Expired</Badge>;
  const d = daysUntil(c.expiryDate);
  return <Badge tone="amber"><Icon name="clock" className="h-3 w-3" />{d === 0 ? 'Expires today' : `Expires in ${d}d`}</Badge>;
}
