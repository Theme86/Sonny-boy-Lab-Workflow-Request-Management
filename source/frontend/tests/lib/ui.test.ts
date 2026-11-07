import { describe, expect, test } from 'vitest';
import { ui } from '@/lib/ui';

describe('shared class names', () => {
  test('every entry is a non-empty string', () => {
    for (const [name, value] of Object.entries(ui)) {
      expect(typeof value, name).toBe('string');
      expect(value.trim().length, name).toBeGreaterThan(0);
    }
  });

  test('all buttons and links show a keyboard focus outline', () => {
    for (const name of ['btnPrimary', 'btnOutline', 'btnText', 'btnDanger', 'link'] as const) {
      expect(ui[name], name).toContain(ui.focus);
    }
  });

  test('surfaces and text colours use theme tokens, so they switch with dark mode', () => {
    for (const name of ['page', 'surface', 'muted', 'border', 'card', 'input'] as const) {
      expect(ui[name], name).toMatch(/-vl-|dark:/);
    }
  });

  test('buttons can be disabled visibly', () => {
    for (const name of ['btnPrimary', 'btnOutline', 'btnText', 'btnDanger'] as const) {
      expect(ui[name], name).toContain('disabled:');
    }
  });
});
