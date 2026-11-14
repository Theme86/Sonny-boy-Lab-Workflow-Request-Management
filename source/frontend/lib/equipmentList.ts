// lib/equipmentList.ts — settings and shared types of the equipment list page.
import type { Equipment } from '@/lib/equipment';

export const PAGE_SIZE = 10;

// the sort choices; the value is sent to the backend as ?sort=
export const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A to Z)' },
  { value: 'name_desc', label: 'Name (Z to A)' },
  { value: 'available_low', label: 'Fewest available' },
  { value: 'available_high', label: 'Most available' },
  { value: 'location', label: 'Location' },
] as const;
export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

// the pop-up is closed, adding a new item, or editing one
export type ModalState = { mode: 'closed' } | { mode: 'add' } | { mode: 'edit'; item: Equipment };

export type LightboxState = { src: string; name: string };

/** What a row (a phone card or a table row) needs to show its buttons. */
export type RowTools = {
  canManage: boolean;
  busyId: number | null;
  onViewPhoto: (item: Equipment) => void;
  onEdit: (item: Equipment) => void;
  onDelete: (item: Equipment) => void;
};