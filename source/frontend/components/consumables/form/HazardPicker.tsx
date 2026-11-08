// components/consumables/form/HazardPicker.tsx — toggle buttons for the GHS hazards of a consumable.
import { useEffect, useState } from 'react';
import type { Hazard } from '@/lib/consumables';
import { fetchHazards } from '@/lib/consumablesApi';
import { ui } from '@/lib/ui';
import { HazardDiamond } from '../ui/Cells';

type Options = { hazards?: Hazard[]; error?: string };

function useHazardOptions() {
  const [options, setOptions] = useState<Options>({});
  useEffect(() => {
    let cancelled = false;
    fetchHazards()
      .then((hazards) => !cancelled && setOptions({ hazards }))
      .catch((err) => !cancelled && setOptions({ error: err instanceof Error ? err.message : 'Hazards could not be loaded' }));
    return () => {
      cancelled = true;
    };
  }, []);
  return options;
}

type Props = { selected: number[]; error?: string; onChange: (ids: number[]) => void };

export function HazardPicker({ selected, error, onChange }: Props) {
  const { hazards, error: loadError } = useHazardOptions();
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter((h) => h !== id) : [...selected, id]);

  if (loadError) return <p className={`text-sm ${ui.errorText}`}>{loadError}</p>;
  if (!hazards) return <p className={`text-sm ${ui.muted}`}>Loading hazards…</p>;
  if (!hazards.length) return <p className={`text-sm ${ui.muted}`}>No hazards set up yet. Run npm run seed:consumables in the backend.</p>;

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Hazards">
        {hazards.map((h) => {
          const on = selected.includes(h.hazardId);
          return (
            <button
              key={h.hazardId}
              type="button"
              aria-pressed={on}
              title={h.description ?? undefined}
              onClick={() => toggle(h.hazardId)}
              className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 text-xs font-medium transition ${ui.focus} ${
                on
                  ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300'
                  : `${ui.border} ${ui.muted} ${ui.hover}`
              }`}
            >
              <HazardDiamond code={h.code} />
              {h.name}
            </button>
          );
        })}
      </div>
      {error && <p className={`mt-1 text-xs ${ui.errorText}`}>{error}</p>}
    </div>
  );
}
