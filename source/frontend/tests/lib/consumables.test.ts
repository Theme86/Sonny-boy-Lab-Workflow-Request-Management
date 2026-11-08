import { describe, expect, test } from 'vitest';
import {
  daysUntil,
  expiryNote,
  expiryStatus,
  formatDate,
  fromApi,
  stockPercent,
  stockStatus,
  unitLabel,
  unitsWith,
  type ApiConsumable,
} from '@/lib/consumables';

const TODAY = new Date('2026-11-08T15:30:00');

describe('fromApi', () => {
  const row: ApiConsumable = {
    consumableId: 1,
    name: 'Ethanol',
    description: null,
    unit: 'ml',
    currentStock: '1500.50',
    reorderThreshold: '200',
    phValue: '7.40',
    expiryDate: '2027-03-15T00:00:00.000Z',
    imageUrl: null,
  };

  test('turns Decimal strings into numbers and trims the date', () => {
    const c = fromApi(row);
    expect(c.currentStock).toBe(1500.5);
    expect(c.reorderThreshold).toBe(200);
    expect(c.phValue).toBe(7.4);
    expect(c.expiryDate).toBe('2027-03-15');
  });

  test('keeps a missing pH and expiry as null and defaults hazards to []', () => {
    const c = fromApi({ ...row, phValue: null, expiryDate: null });
    expect(c.phValue).toBeNull();
    expect(c.expiryDate).toBeNull();
    expect(c.hazards).toEqual([]);
  });

  test('pH 0 stays 0, not null', () => {
    expect(fromApi({ ...row, phValue: '0' }).phValue).toBe(0);
  });
});

describe('units', () => {
  test('labels known units and falls back to the raw text', () => {
    expect(unitLabel('ml')).toBe('Milliliter (ml)');
    expect(unitLabel('bottle')).toBe('bottle');
  });

  test('adds legacy units once, after the standard ones', () => {
    expect(unitsWith(['g', 'bottle', 'bottle'])).toEqual(['ml', 'l', 'g', 'kg', 'pieces', 'bottle']);
    expect(unitsWith([])).toEqual(['ml', 'l', 'g', 'kg', 'pieces']);
  });
});

describe('stockStatus / stockPercent', () => {
  test('out at zero, low at or below the threshold, in above it', () => {
    expect(stockStatus({ currentStock: 0, reorderThreshold: 10 })).toBe('out');
    expect(stockStatus({ currentStock: 10, reorderThreshold: 10 })).toBe('low');
    expect(stockStatus({ currentStock: 11, reorderThreshold: 10 })).toBe('in');
  });

  test('a full bar is three times the threshold, with a small minimum unless empty', () => {
    expect(stockPercent({ currentStock: 30, reorderThreshold: 10 })).toBe(100);
    expect(stockPercent({ currentStock: 15, reorderThreshold: 10 })).toBe(50);
    expect(stockPercent({ currentStock: 0.1, reorderThreshold: 100 })).toBe(3);
    expect(stockPercent({ currentStock: 0, reorderThreshold: 10 })).toBe(0);
  });
});

describe('expiry', () => {
  test('daysUntil counts whole days from the start of today', () => {
    expect(daysUntil('2026-11-08', TODAY)).toBe(0);
    expect(daysUntil('2026-11-09', TODAY)).toBe(1);
    expect(daysUntil('2026-11-01', TODAY)).toBe(-7);
  });

  test('status: none, expired, soon (within 30 days) or ok', () => {
    expect(expiryStatus({ expiryDate: null }, TODAY)).toBe('none');
    expect(expiryStatus({ expiryDate: '2026-11-07' }, TODAY)).toBe('expired');
    expect(expiryStatus({ expiryDate: '2026-11-08' }, TODAY)).toBe('soon');
    expect(expiryStatus({ expiryDate: '2026-12-08' }, TODAY)).toBe('soon');
    expect(expiryStatus({ expiryDate: '2026-12-09' }, TODAY)).toBe('ok');
  });

  test('note text', () => {
    expect(expiryNote('2026-11-05', TODAY)).toBe('Expired 3d ago');
    expect(expiryNote('2026-11-08', TODAY)).toBe('Expires today');
    expect(expiryNote('2026-11-20', TODAY)).toBe('in 12 days');
    expect(expiryNote('2027-05-08', TODAY)).toBe('in 6 months');
  });

  test('formatDate', () => {
    expect(formatDate('2027-03-15')).toBe('15 Mar 2027');
    expect(formatDate(null)).toBe('—');
  });
});
