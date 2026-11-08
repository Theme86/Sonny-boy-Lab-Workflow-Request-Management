// components/consumables/actions.ts — what a row, card or drawer can ask the page to do with an item.
import type { Consumable } from '@/lib/consumables';

export type ItemActions = {
  canManage: boolean;
  onOpen: (c: Consumable) => void;
  onEdit: (c: Consumable) => void;
  onDelete: (c: Consumable) => void;
  onImage: (c: Consumable) => void;
};
