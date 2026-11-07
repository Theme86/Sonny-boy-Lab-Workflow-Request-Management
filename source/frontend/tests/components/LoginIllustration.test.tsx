import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { LoginIllustration } from '@/components/LoginIllustration';

describe('LoginIllustration', () => {
  test('is decoration only, hidden from screen readers', () => {
    const { container } = render(<LoginIllustration />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  test('draws a continuous sine trace on the screen', () => {
    const { container } = render(<LoginIllustration />);
    const trace = container.querySelector('.scope-trace path:last-child') as SVGPathElement;
    const d = trace.getAttribute('d') ?? '';
    expect(d.startsWith('M')).toBe(true);
    expect(d).not.toMatch(/NaN/);
    expect(d.split('L').length).toBeGreaterThan(50);
  });

  test('the wave only moves for people who have not asked for reduced motion', () => {
    const { container } = render(<LoginIllustration />);
    const css = container.querySelector('style')?.textContent ?? '';
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\)\s*{\s*\.scope-trace\s*{\s*animation:/);
  });

  test('shows three measured data points with error bars', () => {
    const { container } = render(<LoginIllustration />);
    expect(container.querySelectorAll('g > circle[r="2.6"]')).toHaveLength(3);
  });
});
