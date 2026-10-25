// lib/theme.ts — light/dark mode. The current theme is the "dark" class on <html>
// (Tailwind's dark: variant is wired to that class in globals.css).
import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/themeScript';

export type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // keep other open tabs in sync
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY || (e.newValue !== 'light' && e.newValue !== 'dark')) return;
    applyTheme(e.newValue);
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  listeners.forEach((l) => l());
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage blocked (private mode) — the choice still applies for this visit
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
