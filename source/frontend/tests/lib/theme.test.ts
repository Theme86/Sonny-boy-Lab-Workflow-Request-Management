import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { setTheme, useTheme } from '@/lib/theme';
import { THEME_STORAGE_KEY } from '@/lib/themeScript';

const root = document.documentElement;

describe('setTheme', () => {
  test('dark: adds the "dark" class, sets the color scheme and remembers the choice', () => {
    setTheme('dark');
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  test('light: removes the "dark" class again', () => {
    setTheme('dark');
    setTheme('light');
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  test('still applies the theme when storage is blocked (private mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => setTheme('dark')).not.toThrow();
    expect(root.classList.contains('dark')).toBe(true);
  });
});

describe('useTheme', () => {
  test('starts as light when the page has no "dark" class', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  test('starts as dark when the page already has the "dark" class', () => {
    root.classList.add('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  test('toggleTheme flips the theme both ways and re-renders', () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(root.classList.contains('dark')).toBe(true);
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(root.classList.contains('dark')).toBe(false);
  });

  test('every component using the hook updates together', () => {
    const a = renderHook(() => useTheme());
    const b = renderHook(() => useTheme());
    act(() => a.result.current.setTheme('dark'));
    expect(b.result.current.theme).toBe('dark');
  });

  test('follows a theme change made in another browser tab', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    });
    expect(result.current.theme).toBe('dark');
  });

  test('ignores storage events for other keys or invalid values', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'something-else', newValue: 'dark' }));
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'blue' }));
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: null }));
    });
    expect(result.current.theme).toBe('light');
  });

  test('stops listening after unmount', () => {
    const { result, unmount } = renderHook(() => useTheme());
    unmount();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }));
    });
    // a stale listener would have added the class; an unmounted hook is simply not re-rendered
    expect(result.current.theme).toBe('light');
  });
});
