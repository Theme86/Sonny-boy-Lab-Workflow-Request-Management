// lib/consumables.ts — consumable types, API conversion, and stock / expiry rules.

export const UNITS = ['ml', 'l', 'g', 'kg', 'pieces'] as const;
const UNIT_LABELS: Record<string, string> = {
  ml: 'Milliliter (ml)',
  l: 'Liter (l)',
  g: 'Gram (g)',
  kg: 'Kilogram (kg)',
  pieces: 'Pieces',
};

export const EXPIRY_SOON_DAYS = 30;
const DAY_MS = 86_400_000;

/** A GHS hazard; `code` is the pictogram code, e.g. "GHS02" (may be missing on hazards added by hand). */
export type Hazard = { hazardId: number; code: string | null; name: string; description?: string | null };

/** A storage / handling tag, e.g. "Light sensitive". */
export type Property = { propertyId: number; name: string; description?: string | null };

export type Consumable = {
  consumableId: number;
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  phValue: number | null;
  expiryDate: string | null; // "YYYY-MM-DD"
  imageUrl: string | null;
  hazards: Hazard[];
  properties: Property[];
};

export type ApiConsumable = Omit<Consumable, 'currentStock' | 'reorderThreshold' | 'phValue' | 'hazards' | 'properties'> & {
  currentStock: string | number;
  reorderThreshold: string | number;
  phValue: string | number | null;
  hazards?: Hazard[];
  properties?: Property[];
};

export type SavePayload = {
  name: string;
  description: string | null;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  phValue: number | null;
  expiryDate: string | null;
  imageUrl: string | null;
  hazardIds: number[];
  propertyIds: number[];
};

// Prisma Decimal arrives as a string and dates as full ISO strings.
export function fromApi(r: ApiConsumable): Consumable {
  return {
    ...r,
    currentStock: Number(r.currentStock),
    reorderThreshold: Number(r.reorderThreshold),
    phValue: r.phValue == null ? null : Number(r.phValue),
    expiryDate: r.expiryDate ? r.expiryDate.slice(0, 10) : null,
    hazards: r.hazards ?? [],
    properties: r.properties ?? [],
  };
}

export const unitLabel = (u: string) => UNIT_LABELS[u] ?? u;

const isStandardUnit = (u: string) => (UNITS as readonly string[]).includes(u);

/** The standard units plus any legacy unit (e.g. "bottle") so it stays selectable. */
export function unitsWith(extra: string[]): string[] {
  return [...UNITS, ...new Set(extra.filter((u) => !isStandardUnit(u)))];
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
const toLocalDate = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`);

export function daysUntil(iso: string, today = new Date()) {
  return Math.round((toLocalDate(iso).getTime() - startOfDay(today).getTime()) / DAY_MS);
}

export function formatDate(iso: string | null) {
  if (!iso) return '—';
  return toLocalDate(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const fmtNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

export type StockStatus = 'in' | 'low' | 'out';
export function stockStatus(c: Pick<Consumable, 'currentStock' | 'reorderThreshold'>): StockStatus {
  if (c.currentStock <= 0) return 'out';
  if (c.currentStock <= c.reorderThreshold) return 'low';
  return 'in';
}

/** Width of the stock bar: the full bar is three times the reorder threshold. */
export function stockPercent(c: Pick<Consumable, 'currentStock' | 'reorderThreshold'>) {
  const max = Math.max(c.reorderThreshold * 3, c.currentStock, 1);
  const pct = Math.min(100, (c.currentStock / max) * 100);
  return stockStatus(c) === 'out' ? pct : Math.max(pct, 3);
}

export type ExpiryStatus = 'none' | 'ok' | 'soon' | 'expired';
export function expiryStatus(c: Pick<Consumable, 'expiryDate'>, today = new Date()): ExpiryStatus {
  if (!c.expiryDate) return 'none';
  const d = daysUntil(c.expiryDate, today);
  if (d < 0) return 'expired';
  if (d <= EXPIRY_SOON_DAYS) return 'soon';
  return 'ok';
}

/** Short relative text under the expiry date, e.g. "in 12 days" or "Expired 3d ago". */
export function expiryNote(iso: string, today = new Date()) {
  const d = daysUntil(iso, today);
  if (d < 0) return `Expired ${Math.abs(d)}d ago`;
  if (d === 0) return 'Expires today';
  if (d > 60) return `in ${Math.round(d / 30)} months`;
  return `in ${d} days`;
}
