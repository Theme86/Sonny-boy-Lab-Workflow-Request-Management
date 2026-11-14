// lib/equipmentStock.ts — how much of an item is free: in / low / out.
import type { Equipment } from './equipmentTypes';

export type Stock = 'in' | 'low' | 'out';

/** out = none free, low = 25% or less is free, in = plenty free */
export function stockLevel(item: Pick<Equipment, 'quantityTotal' | 'quantityAvailable'>): Stock {
  if (item.quantityAvailable <= 0) return 'out';
  if (item.quantityTotal > 0 && item.quantityAvailable / item.quantityTotal <= 0.25) return 'low';
  return 'in';
}

export const STOCK_LABELS: Record<Stock, string> = {
  in: 'Available',
  low: 'Running low',
  out: 'None available',
};