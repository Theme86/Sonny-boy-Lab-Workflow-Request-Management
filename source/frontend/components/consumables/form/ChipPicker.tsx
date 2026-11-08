// components/consumables/form/ChipPicker.tsx — toggle chips for picking several items from a list loaded from the API
// (used for hazards and properties).
import { useEffect, useState, type ReactNode } from 'react';
import { ui } from '@/lib/ui';

export type ChipOption = { id: number; label: string; hint?: string | null; icon?: ReactNode };

const ON_TONES = {
  red: 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300',
  accent: 'border-vl-accent bg-vl-accent/10 text-vl-accent',
};

/** `load` must be a stable function (e.g. imported from lib/consumablesApi), or the list reloads on every render. */
function useOptions<T>(load: () => Promise<T[]>) {
  const [state, setState] = useState<{ items?: T[]; error?: string }>({});
  useEffect(() => {
    let cancelled = false;
    load()
      .then((items) => !cancelled && setState({ items }))
      .catch((err) => !cancelled && setState({ error: err instanceof Error ? err.message : 'The list could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, [load]);
  return state;
}

type Props<T> = {
  label: string;
  load: () => Promise<T[]>;
  toOption: (item: T) => ChipOption;
  selected: number[];
  onChange: (ids: number[]) => void;
  error?: string;
  emptyText: string;
  tone: keyof typeof ON_TONES;
};

export function ChipPicker<T>({ label, load, toOption, selected, onChange, error, emptyText, tone }: Props<T>) {
  const { items, error: loadError } = useOptions(load);
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (loadError) return <p className={`text-sm ${ui.errorText}`}>{loadError}</p>;
  if (!items) return <p className={`text-sm ${ui.muted}`}>Loading…</p>;
  if (!items.length) return <p className={`text-sm ${ui.muted}`}>{emptyText}</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {items.map(toOption).map(({ id, label: text, hint, icon }) => {
          const on = selected.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              title={hint ?? undefined}
              onClick={() => toggle(id)}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pr-3 text-xs font-medium transition ${icon ? 'pl-1' : 'pl-3'} ${ui.focus} ${
                on ? ON_TONES[tone] : `${ui.border} ${ui.muted} ${ui.hover}`
              }`}
            >
              {icon}
              {text}
            </button>
          );
        })}
      </div>
      {error && <p className={`mt-1 text-xs ${ui.errorText}`}>{error}</p>}
    </div>
  );
}
