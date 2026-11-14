// components/equipment/EquipmentSearchBox.tsx — the search field above the list.
import { SearchIcon } from '@/components/icons';

type Props = { value: string; onChange: (value: string) => void };

export function EquipmentSearchBox({ value, onChange }: Props) {
  return (
    <label className="relative block sm:flex-1">
      <span className="sr-only">Search equipment by name or location</span>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-vl-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or location"
        className="h-11 w-full rounded-full bg-vl-hover pr-4 pl-11 text-[15px] outline-none placeholder:text-vl-muted focus:bg-white focus:ring-2 focus:ring-vl-accent dark:bg-vl-surface-2 dark:focus:bg-vl-surface"
      />
    </label>
  );
}