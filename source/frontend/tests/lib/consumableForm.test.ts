import { describe, expect, test } from 'vitest';
import { hasErrors, toForm, toPayload, validateForm, validatePhoto, type FormState } from '@/lib/consumableForm';
import type { Consumable } from '@/lib/consumables';

const valid: FormState = {
  name: 'Ethanol',
  description: '',
  unit: 'ml',
  currentStock: '100',
  reorderThreshold: '20',
  phValue: '',
  expiryDate: '',
  imageUrl: '',
  hazardIds: [],
};
const with_ = (o: Partial<FormState>): FormState => ({ ...valid, ...o });

describe('validateForm', () => {
  test('accepts a form with only the required fields', () => {
    expect(validateForm(valid)).toEqual({});
  });

  test('requires name, unit, stock and threshold', () => {
    const e = validateForm(with_({ name: '  ', unit: '', currentStock: '', reorderThreshold: '' }));
    expect(Object.keys(e).sort()).toEqual(['currentStock', 'name', 'reorderThreshold', 'unit']);
  });

  test('rejects negative quantities, long text, pH outside 0-14 and long URLs', () => {
    const e = validateForm(
      with_({
        name: 'x'.repeat(151),
        description: 'x'.repeat(251),
        currentStock: '-1',
        reorderThreshold: '-1',
        phValue: '14.5',
        imageUrl: 'x'.repeat(501),
      }),
    );
    expect(hasErrors(e)).toBe(true);
    expect(e.name).toBe('Max 150 characters.');
    expect(e.description).toBe('Max 250 characters.');
    expect(e.currentStock).toBe('Must be 0 or more.');
    expect(e.phValue).toBe('pH must be between 0 and 14.');
    expect(e.imageUrl).toBe('URL max 500 characters.');
  });

  test('pH 0 and 14 are allowed', () => {
    expect(validateForm(with_({ phValue: '0' }))).toEqual({});
    expect(validateForm(with_({ phValue: '14' }))).toEqual({});
  });
});

describe('toPayload', () => {
  test('trims text, turns empty optional fields into null and numbers into numbers', () => {
    const f = with_({ name: ' Ethanol ', description: '  ', phValue: '7', imageUrl: ' http://x/a.png ', hazardIds: [2, 7] });
    expect(toPayload(f, false)).toEqual({
      name: 'Ethanol',
      description: null,
      unit: 'ml',
      currentStock: 100,
      reorderThreshold: 20,
      phValue: 7,
      expiryDate: null,
      imageUrl: 'http://x/a.png',
      hazardIds: [2, 7],
    });
  });

  test('drops the URL when a file is being uploaded instead', () => {
    expect(toPayload(with_({ imageUrl: 'http://x/a.png' }), true).imageUrl).toBeNull();
  });
});

test('toForm fills the form from an item, and is empty for a new one', () => {
  const c: Consumable = {
    consumableId: 1, name: 'NaCl', description: null, unit: 'g', currentStock: 5, reorderThreshold: 1,
    phValue: 0, expiryDate: null, imageUrl: null, hazards: [{ hazardId: 5, code: 'GHS05', name: 'Corrosive' }],
  };
  expect(toForm(c)).toMatchObject({ name: 'NaCl', description: '', currentStock: '5', phValue: '0', expiryDate: '', hazardIds: [5] });
  expect(toForm()).toMatchObject({ name: '', currentStock: '', phValue: '', hazardIds: [] });
});

test('validatePhoto accepts JPG/PNG/WEBP up to 5 MB', () => {
  expect(validatePhoto({ type: 'image/png', size: 1000 })).toBeNull();
  expect(validatePhoto({ type: 'image/gif', size: 1000 })).toBe('Choose a JPG, PNG or WEBP image.');
  expect(validatePhoto({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).toBe('Choose an image of 5 MB or less.');
});
