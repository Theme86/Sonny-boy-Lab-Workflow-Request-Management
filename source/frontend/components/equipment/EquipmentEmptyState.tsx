// components/equipment/EquipmentEmptyState.tsx — "Loading…" and the messages for an empty list.
import type { EquipmentListResponse } from '@/lib/equipment';
import { ui } from '@/lib/ui';

type Props = { data: EquipmentListResponse | null; loading: boolean; filtered: boolean; canManage: boolean };

export function EquipmentEmptyState({ data, loading, filtered, canManage }: Props) {
  return (
    <>
      {data && data.items.length === 0 && (
        <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>
          {filtered
            ? 'No equipment matches your search. Try a different name or clear the filter.'
            : canManage
              ? 'No equipment yet. Use "Add equipment" to add the first one.'
              : 'No equipment has been added yet.'}
        </p>
      )}
      {!data && loading && <p className={`px-4 py-16 text-center text-sm ${ui.muted}`}>Loading equipment…</p>}
    </>
  );
}