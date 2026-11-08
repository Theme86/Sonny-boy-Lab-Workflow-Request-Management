// components/consumables/detail/DetailDrawer.tsx — side panel with every detail of one consumable, opened from a row or card.
import { useState, type ReactNode } from 'react';
import { fmtNum, formatDate, unitLabel, type Consumable } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import { ExpiryBadge, StockBadge } from '../ui/Badges';
import { HazardDiamond, StockCell } from '../ui/Cells';
import { Icon, IconButton } from '../ui/icons';
import { btn } from '../ui/styles';
import { Thumb } from '../ui/Thumb';
import { useOverlay } from '../ui/useOverlay';

const TABS = ['Overview', 'Hazards', 'Properties'] as const;
type Tab = (typeof TABS)[number];

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className={`text-xs ${ui.muted}`}>{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Overview({ item }: { item: Consumable }) {
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
        <DetailItem label="Current stock" value={`${fmtNum(item.currentStock)} ${item.unit}`} />
        <DetailItem label="Reorder threshold" value={`${fmtNum(item.reorderThreshold)} ${item.unit}`} />
        <DetailItem label="Unit" value={unitLabel(item.unit)} />
        <DetailItem label="pH value" value={item.phValue != null ? item.phValue.toFixed(2) : '—'} />
        <DetailItem label="Expiry date" value={formatDate(item.expiryDate)} />
      </dl>
      <div>
        <p className={`mb-2 text-xs font-medium ${ui.muted}`}>Stock level</p>
        <StockCell c={item} />
      </div>
    </div>
  );
}

function Hazards({ item }: { item: Consumable }) {
  if (!item.hazards.length) return <p className={`py-6 text-center text-sm ${ui.muted}`}>No hazards recorded.</p>;
  return (
    <ul className={`divide-y rounded-lg border ${ui.border} divide-vl-line`}>
      {item.hazards.map((h) => (
        <li key={h.hazardId} className="flex items-center gap-3 px-3 py-2.5">
          <HazardDiamond code={h.code} />
          <span className="text-sm font-medium">{h.name}</span>
          {h.code && <span className={`ml-auto text-xs ${ui.muted}`}>{h.code}</span>}
        </li>
      ))}
    </ul>
  );
}

function Properties({ item }: { item: Consumable }) {
  if (!item.properties.length) return <p className={`py-6 text-center text-sm ${ui.muted}`}>No properties recorded.</p>;
  return (
    <ul className={`divide-y rounded-lg border ${ui.border} divide-vl-line`}>
      {item.properties.map((p) => (
        <li key={p.propertyId} className="px-3 py-2.5">
          <div className="text-sm font-medium">{p.name}</div>
          {p.description && <div className={`mt-0.5 text-xs ${ui.muted}`}>{p.description}</div>}
        </li>
      ))}
    </ul>
  );
}

function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className={`flex gap-6 overflow-x-auto border-b px-6 ${ui.border}`} aria-label="Tabs">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onTab(t)}
          className={`-mb-px whitespace-nowrap border-b-2 pb-3 text-sm transition ${
            tab === t ? 'border-vl-accent font-medium text-vl-accent' : `border-transparent ${ui.muted} hover:text-vl-ink`
          }`}
        >
          {t}
        </button>
      ))}
    </nav>
  );
}

type Props = {
  item: Consumable;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewImage: () => void;
};

export function DetailDrawer({ item, canManage, onClose, onEdit, onDelete, onPreviewImage }: Props) {
  useOverlay(onClose);
  const [tab, setTab] = useState<Tab>('Overview');

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-vl-surface shadow-2xl">
        <div className={`flex items-center justify-between gap-4 border-b px-6 py-4 ${ui.border}`}>
          <div className="min-w-0">
            <p className={`text-xs ${ui.muted}`}>Consumable #{item.consumableId}</p>
            <h2 className="truncate text-lg font-semibold">{item.name}</h2>
          </div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-5 px-6 py-5">
            <Thumb src={item.imageUrl} alt={item.name} size="lg" onClick={onPreviewImage} />
            <div className="min-w-0 flex-1 space-y-3">
              <p className={`text-sm ${ui.muted}`}>{item.description ?? <span className="italic">No description</span>}</p>
              <div className="flex flex-wrap gap-1.5">
                <StockBadge c={item} />
                <ExpiryBadge c={item} />
              </div>
            </div>
          </div>
          <TabBar tab={tab} onTab={setTab} />
          <div className="px-6 py-5">
            {tab === 'Overview' && <Overview item={item} />}
            {tab === 'Hazards' && <Hazards item={item} />}
            {tab === 'Properties' && <Properties item={item} />}
          </div>
        </div>

        {canManage && (
          <div className={`flex items-center justify-between border-t px-6 py-3 ${ui.border}`}>
            <button type="button" className={btn.dangerText} onClick={onDelete}>
              <Icon name="trash" /> <span className="ml-1.5">Delete</span>
            </button>
            <button type="button" className={btn.primary} onClick={onEdit}>
              <Icon name="pencil" /> <span className="ml-1.5">Edit</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
