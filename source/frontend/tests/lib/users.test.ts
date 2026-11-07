import { describe, expect, test } from 'vitest';
import {
  PROFILE_LIMITS,
  ROLE_LABELS,
  ROLES,
  formatDate,
  fullName,
  initials,
  validateProfile,
  type ProfileFields,
} from '@/lib/users';

const valid: ProfileFields = { firstName: 'Ada', lastName: 'Lovelace', studentId: '', phone: '', department: '', bio: '' };
const with_ = (o: Partial<ProfileFields>): ProfileFields => ({ ...valid, ...o });

describe('validateProfile', () => {
  test('accepts a profile with only the required names', () => {
    expect(validateProfile(valid)).toEqual({});
  });

  test('accepts a fully filled profile', () => {
    const full = with_({ studentId: '6710545725', phone: '081-234-5678', department: 'SKE', bio: 'I run the microscope.' });
    expect(validateProfile(full)).toEqual({});
  });

  test.each(['firstName', 'lastName'] as const)('%s is required, whitespace does not count', (key) => {
    expect(validateProfile(with_({ [key]: '' }))[key]).toMatch(/required/);
    expect(validateProfile(with_({ [key]: '    ' }))[key]).toMatch(/required/);
  });

  test.each(['firstName', 'lastName'] as const)('%s allows 100 characters but not 101', (key) => {
    expect(validateProfile(with_({ [key]: 'x'.repeat(100) }))[key]).toBeUndefined();
    expect(validateProfile(with_({ [key]: 'x'.repeat(101) }))[key]).toBe('At most 100 characters.');
  });

  test('student ID: digits only', () => {
    expect(validateProfile(with_({ studentId: 'abc' })).studentId).toBe('Use numbers only.');
    expect(validateProfile(with_({ studentId: '12a45' })).studentId).toBe('Use numbers only.');
    expect(validateProfile(with_({ studentId: '  6710545725  ' })).studentId).toBeUndefined();
  });

  test('student ID: at most 20 digits', () => {
    expect(validateProfile(with_({ studentId: '1'.repeat(20) })).studentId).toBeUndefined();
    expect(validateProfile(with_({ studentId: '1'.repeat(21) })).studentId).toBe('At most 20 characters.');
  });

  test.each(['081-234-5678', '081 234 5678', '+66 81 234 5678', '0812345678'])('phone %s is accepted', (phone) => {
    expect(validateProfile(with_({ phone })).phone).toBeUndefined();
  });

  test.each(['abcdef', '12345', '081-234-5678x', '(081) 234 5678', '++6612345678'])('phone %s is rejected', (phone) => {
    expect(validateProfile(with_({ phone })).phone).toMatch(/digits/);
  });

  test('phone: at most 20 characters', () => {
    expect(validateProfile(with_({ phone: '0'.repeat(20) })).phone).toBeUndefined();
    expect(validateProfile(with_({ phone: '0'.repeat(21) })).phone).toBe('At most 20 characters.');
  });

  test('department allows 150 characters but not 151', () => {
    expect(validateProfile(with_({ department: 'd'.repeat(150) })).department).toBeUndefined();
    expect(validateProfile(with_({ department: 'd'.repeat(151) })).department).toBe('At most 150 characters.');
  });

  test('bio allows 300 characters but not 301', () => {
    expect(validateProfile(with_({ bio: 'b'.repeat(300) })).bio).toBeUndefined();
    expect(validateProfile(with_({ bio: 'b'.repeat(301) })).bio).toBe('At most 300 characters.');
  });

  test('reports every problem at once, not only the first', () => {
    const errors = validateProfile({ firstName: '', lastName: '', studentId: 'x', phone: 'y', department: '', bio: '' });
    expect(Object.keys(errors).sort()).toEqual(['firstName', 'lastName', 'phone', 'studentId']);
  });

  test('limits match the backend (userRoutes.js): name 100, ID 20, phone 20, department 150, bio 300', () => {
    expect(PROFILE_LIMITS).toEqual({ name: 100, studentId: 20, phone: 20, department: 150, bio: 300 });
  });
});

describe('fullName', () => {
  const base = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ku.th' };

  test('joins first and last name', () => {
    expect(fullName(base)).toBe('Ada Lovelace');
  });

  test('works with only one name', () => {
    expect(fullName({ ...base, lastName: '' })).toBe('Ada');
    expect(fullName({ ...base, firstName: '' })).toBe('Lovelace');
  });

  test('falls back to the email when both names are empty', () => {
    expect(fullName({ ...base, firstName: '', lastName: '' })).toBe('ada@ku.th');
    expect(fullName({ ...base, firstName: ' ', lastName: ' ' })).toBe('ada@ku.th');
  });
});

describe('initials', () => {
  const base = { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ku.th' };

  test('first letters of both names, upper case', () => {
    expect(initials(base)).toBe('AL');
    expect(initials({ ...base, firstName: 'ada', lastName: 'lovelace' })).toBe('AL');
  });

  test('one name gives one letter', () => {
    expect(initials({ ...base, lastName: '' })).toBe('A');
  });

  test('falls back to the first letter of the email', () => {
    expect(initials({ ...base, firstName: '', lastName: '', email: 'zed@ku.th' })).toBe('Z');
  });
});

describe('formatDate', () => {
  test('null means "Never"', () => {
    expect(formatDate(null)).toBe('Never');
    expect(formatDate(null, true)).toBe('Never');
  });

  test('shows day, short month and year', () => {
    expect(formatDate('2026-01-05T12:00:00.000Z')).toMatch(/^\d{1,2} Jan 2026$/);
  });

  test('can include the time', () => {
    expect(formatDate('2026-01-05T12:00:00.000Z', true)).toMatch(/^\d{1,2} Jan 2026,? \d{2}:\d{2}$/);
  });
});

describe('roles', () => {
  test('ROLES lists the four roles from the database enum, in order', () => {
    expect(ROLES).toEqual(['member', 'ta', 'lecturer', 'lab_manager']);
  });

  test('every role has a label and there are no extra labels', () => {
    expect(Object.keys(ROLE_LABELS).sort()).toEqual([...ROLES].sort());
    expect(ROLE_LABELS.lab_manager).toBe('Lab Manager');
  });
});
