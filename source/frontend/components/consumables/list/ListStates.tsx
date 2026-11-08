// components/consumables/list/ListStates.tsx — what the list area shows while loading, on error, when empty, and its footer.
import { ui } from '@/lib/ui';
import { Icon } from '../ui/icons';
import { btn } from '../ui/styles';

export function ListLoading() {
  return <p className={`px-6 py-16 text-center text-sm ${ui.muted}`}>Loading consumables…</p>;
}

export function ListError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className={`text-sm ${ui.errorText}`}>{message}</p>
      <button type="button" className={`${btn.secondary} mt-4`} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={btn.primary} onClick={onClick}>
      <Icon name="plus" /> <span className="ml-1.5">Add consumable</span>
    </button>
  );
}

type EmptyProps = { noItemsAtAll: boolean; onAdd?: () => void; onClearFilters: () => void };

/** `onAdd` is only passed to users who may add items. */
export function ListEmpty({ noItemsAtAll, onAdd, onClearFilters }: EmptyProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className={`grid h-12 w-12 place-items-center rounded-full bg-vl-hover ${ui.muted}`}>
        <Icon name="flask" className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{noItemsAtAll ? 'No consumables yet' : 'No consumables match your filters'}</h3>
      <p className={`mt-1 text-sm ${ui.muted}`}>
        {noItemsAtAll ? 'Add your first chemical or supply to get started.' : 'Try a different search term or clear the filters.'}
      </p>
      <div className="mt-5">
        {noItemsAtAll ? (
          onAdd && <AddButton onClick={onAdd} />
        ) : (
          <button type="button" className={btn.secondary} onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

type FooterProps = { shown: number; total: number; filtered: boolean; onClearFilters: () => void };

export function ListFooter({ shown, total, filtered, onClearFilters }: FooterProps) {
  return (
    <div className={`flex items-center justify-between border-t px-6 py-3 text-xs ${ui.border} ${ui.muted}`}>
      <span>
        Showing <span className="font-medium">{shown}</span> of {total} consumables
      </span>
      {filtered && (
        <button type="button" className="font-medium hover:underline" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}
