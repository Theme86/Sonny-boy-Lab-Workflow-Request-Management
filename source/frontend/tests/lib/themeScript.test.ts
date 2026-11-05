// The script runs in <head> before the page paints. These tests run the real script text.
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { THEME_STORAGE_KEY, themeInitScript } from '@/lib/themeScript';

const root = document.documentElement;
const runScript = () => new Function(themeInitScript)();

function systemPrefers(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark'), media: query }));
}

beforeEach(() => systemPrefers(false));

describe('themeInitScript', () => {
  test('the storage key is "theme" (ThemeToggle and the script must agree)', () => {
    expect(THEME_STORAGE_KEY).toBe('theme');
    expect(themeInitScript).toContain(`'${THEME_STORAGE_KEY}'`);
  });

  test('applies a saved dark theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    runScript();
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
  });

  test('a saved light theme beats a dark system setting', () => {
    systemPrefers(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    runScript();
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  test('with nothing saved, follows the system setting (dark)', () => {
    systemPrefers(true);
    runScript();
    expect(root.classList.contains('dark')).toBe(true);
  });

  test('with nothing saved, follows the system setting (light)', () => {
    runScript();
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  test('an invalid saved value is ignored in favour of the system setting', () => {
    systemPrefers(true);
    localStorage.setItem(THEME_STORAGE_KEY, 'blue');
    runScript();
    expect(root.classList.contains('dark')).toBe(true);
  });

  test('removes a stale "dark" class when the saved theme is light', () => {
    root.classList.add('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    runScript();
    expect(root.classList.contains('dark')).toBe(false);
  });

  test('never throws, even when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(runScript).not.toThrow();
  });
});
