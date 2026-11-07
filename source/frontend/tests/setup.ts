// Runs before every test file.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, vi } from 'vitest';

// next/link needs the Next.js router at runtime; in tests a plain <a> is enough.
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children?: ReactNode } & Record<string, unknown>) =>
    createElement('a', { href, ...rest }, children),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.className = '';
  document.documentElement.style.colorScheme = '';
});
