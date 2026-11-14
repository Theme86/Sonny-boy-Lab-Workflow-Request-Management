import { describe, expect, test } from 'vitest';
import {
  EMPTY_EQUIPMENT_FIELDS,
  fieldsFromEquipment,
  stockLevel,
  toRequestBody,
  validateEquipment,
  type Equipment,
  type EquipmentFields,
} from '@/lib/equipment';

const valid: EquipmentFields = { ...EMPTY_EQUIPMENT_FIELDS, name: 'Oscilloscope', quantityTotal: '8', quantityAvailable: '3' };
const with_ = (o: Partial<EquipmentFields>): EquipmentFields => ({ ...valid, ...o });

describe('validateEquipment', () => {
  test('accepts a full, valid form', () => {
    expect(validateEquipment(valid)).toEqual({});
  });

  test('accepts only a name (quantities are optional)', () => {
    expect(validateEquipment({ ...EMPTY_EQUIPMENT_FIELDS, name: 'Beaker' })).toEqual({});
  });

  test('a missing or blank name is an error', () => {
    expect(validateEquipment(with_({ name: '' })).name).toBeTruthy();
    expect(validateEquipment(with_({ name: '   ' })).name).toBeTruthy();
  });

  test.each(['-1', '1.5', 'abc', '1e3', '0x10', '1 2'])('"%s" is not a whole number for the total', (text) => {
    expect(validateEquipment(with_({ quantityTotal: text, quantityAvailable: '' })).quantityTotal).toBeTruthy();
  });

  test.each(['-1', '1.5', 'abc'])('"%s" is not a whole number for available', (text) => {
    expect(validateEquipment(with_({ quantityAvailable: text })).quantityAvailable).toBeTruthy();
  });

  test('0 is a valid quantity, and spaces around a number are fine', () => {
    expect(validateEquipment(with_({ quantityTotal: '0', quantityAvailable: '0' }))).toEqual({});
    expect(validateEquipment(with_({ quantityTotal: ' 8 ', quantityAvailable: ' 3 ' }))).toEqual({});
  });

  test('available cannot be more than the total', () => {
    expect(validateEquipment(with_({ quantityTotal: '3', quantityAvailable: '4' })).quantityAvailable).toBeTruthy();
    expect(validateEquipment(with_({ quantityTotal: '3', quantityAvailable: '3' }))).toEqual({});
  });

  test('an empty total counts as 0 when checking available', () => {
    expect(validateEquipment(with_({ quantityTotal: '', quantityAvailable: '1' })).quantityAvailable).toBeTruthy();
  });

  test('a bad total does not also produce an "available too high" message', () => {
    const errors = validateEquipment(with_({ quantityTotal: 'x', quantityAvailable: '5' }));
    expect(errors.quantityTotal).toBeTruthy();
    expect(errors.quantityAvailable).toBeUndefined();
  });

  test('can report several problems at once', () => {
    const errors = validateEquipment({ ...EMPTY_EQUIPMENT_FIELDS, quantityTotal: '-1', quantityAvailable: 'z' });
    expect(Object.keys(errors).sort()).toEqual(['name', 'quantityAvailable', 'quantityTotal']);
  });
});

describe('toRequestBody', () => {
  test('turns text into trimmed strings and numbers', () => {
    expect(toRequestBody(with_({ name: '  Hot plate ', description: ' Heats ', location: ' Room 1 ' }))).toEqual({
      name: 'Hot plate',
      description: 'Heats',
      location: 'Room 1',
      quantityTotal: 8,
      quantityAvailable: 3,
    });
  });

  test('empty description and location become null, so they are cleared', () => {
    const body = toRequestBody(valid);
    expect(body.description).toBeNull();
    expect(body.location).toBeNull();
  });

  test('on create, an empty available is left out so the backend uses the total', () => {
    const body = toRequestBody(with_({ quantityAvailable: '' }));
    expect('quantityAvailable' in body).toBe(false);
  });

  test('on edit, an empty available is sent as 0 (what the form shows is what is saved)', () => {
    expect(toRequestBody(with_({ quantityAvailable: '' }), true).quantityAvailable).toBe(0);
  });

  test('an empty total is sent as 0', () => {
    expect(toRequestBody({ ...EMPTY_EQUIPMENT_FIELDS, name: 'X' }).quantityTotal).toBe(0);
  });

  test('a typed 0 for available is kept (not treated as empty)', () => {
    expect(toRequestBody(with_({ quantityAvailable: '0' })).quantityAvailable).toBe(0);
  });

  test('never sends imageUrl or ids', () => {
    expect(Object.keys(toRequestBody(valid)).sort()).toEqual(['description', 'location', 'name', 'quantityAvailable', 'quantityTotal']);
  });
});

describe('fieldsFromEquipment', () => {
  const item: Equipment = {
    equipmentId: 1, name: 'Microscope', description: null, quantityTotal: 20, quantityAvailable: 4, location: null, imageUrl: null,
  };

  test('fills the form from an item, with null shown as an empty box and numbers as text', () => {
    expect(fieldsFromEquipment(item)).toEqual({
      name: 'Microscope', description: '', location: '', quantityTotal: '20', quantityAvailable: '4',
    });
  });

  test('round trip: editing without changes sends the same quantities back', () => {
    const body = toRequestBody(fieldsFromEquipment(item), true);
    expect(body.quantityTotal).toBe(20);
    expect(body.quantityAvailable).toBe(4);
  });
});

describe('stockLevel', () => {
  const level = (total: number, available: number) => stockLevel({ quantityTotal: total, quantityAvailable: available });

  test('none free is "out", even when the total is 0', () => {
    expect(level(10, 0)).toBe('out');
    expect(level(0, 0)).toBe('out');
  });

  test('25% or less free is "low"', () => {
    expect(level(8, 2)).toBe('low'); // exactly 25%
    expect(level(20, 4)).toBe('low'); // 20%
    expect(level(100, 1)).toBe('low');
  });

  test('more than 25% free is "in"', () => {
    expect(level(8, 3)).toBe('in'); // 37.5%
    expect(level(5, 5)).toBe('in');
  });
});