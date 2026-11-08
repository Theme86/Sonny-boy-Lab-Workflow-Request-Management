// components/consumables/list/ConsumableGrid.tsx — grid view: one card per consumable with a large image.
import { useState } from 'react';
import { imageUrl as resolveImageUrl } from '@/lib/api';
import type { Consumable } from '@/lib/consumables';
import { ui } from '@/lib/ui';
import type { ItemActions } from '../actions';
import { ExpiryBadge, StockBadge } from '../ui/Badges';
import { ExpiryCell, HazardPills, StockCell } from '../ui/Cells';
import { Icon } from '../ui/icons';

function CardImage({ c, onImage }: { c: Consumable; onImage: () => void }) {
  const [broken, setBroken] = useState(false);
  const src = resolveImageUrl(c.imageUrl);
  if (!src || broken) {
    return (
      <div className={`grid h-full place-items-center ${ui.muted}`}>
        <Icon name="flask" className="h-12 w-12" />
      </div>
    );
  }
  return (
    <button type="button" onClick={onImage} className="h-full w-full" title="View image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={c.name} onError={() => setBroken(true)} className="h-full w-full object-cover" />
    </button>
  );
}

function ConsumableCard({ c, actions }: { c: Consumable; actions: ItemActions }) {
  return (
    <div className={`flex flex-col overflow-hidden ${ui.card}`}>
      <div className="relative aspect-[4/3] bg-vl-hover">
        <CardImage c={c} onImage={() => actions.onImage(c)} />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
          <StockBadge c={c} />
          <ExpiryBadge c={c} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <button type="button" onClick={() => actions.onOpen(c)} className="text-left">
          <h3 className="font-medium hover:underline">{c.name}</h3>
          <p className={`mt-0.5 line-clamp-1 text-sm ${ui.muted}`}>{c.description ?? 'No description'}</p>
        </button>
        <div className="mt-4">
          <StockCell c={c} />
        </div>
        <div className={`mt-auto flex items-end justify-between gap-2 border-t pt-3 ${ui.border}`}>
          <ExpiryCell c={c} />
          <HazardPills hazards={c.hazards} />
        </div>
      </div>
      <div className={`flex divide-x border-t text-sm ${ui.border} divide-vl-line`}>
        <button type="button" onClick={() => actions.onOpen(c)} className={`flex-1 py-2 ${ui.hover}`}>View</button>
        {actions.canManage && (
          <>
            <button type="button" onClick={() => actions.onEdit(c)} className={`flex-1 py-2 ${ui.hover}`}>Edit</button>
            <button type="button" onClick={() => actions.onDelete(c)} className={`flex-1 py-2 ${ui.errorText} hover:bg-[#b3261e]/5`}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConsumableGrid({ items, actions }: { items: Consumable[]; actions: ItemActions }) {
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((c) => (
        <ConsumableCard key={c.consumableId} c={c} actions={actions} />
      ))}
    </div>
  );
}
