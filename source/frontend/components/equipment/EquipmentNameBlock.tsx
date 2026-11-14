// components/equipment/EquipmentNameBlock.tsx — the photo, name and description of one item.
import { EquipmentPhoto } from '@/components/EquipmentPhoto';
import type { Equipment } from '@/lib/equipment';
import { ui } from '@/lib/ui';

type Props = { item: Equipment; onViewPhoto: (item: Equipment) => void };

export function EquipmentNameBlock({ item, onViewPhoto }: Props) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      {item.imageUrl ? (
        // click the photo to see it large
        <button
          type="button"
          onClick={() => onViewPhoto(item)}
          aria-label={`View photo of ${item.name}`}
          className={`shrink-0 rounded-xl transition hover:opacity-80 ${ui.focus}`}
        >
          <EquipmentPhoto src={item.imageUrl} name={item.name} size="md" />
        </button>
      ) : (
        <EquipmentPhoto src={item.imageUrl} name={item.name} size="md" />
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium">{item.name}</p>
        {item.description && <p className={`mt-0.5 line-clamp-2 text-xs ${ui.muted}`}>{item.description}</p>}
      </div>
    </div>
  );
}