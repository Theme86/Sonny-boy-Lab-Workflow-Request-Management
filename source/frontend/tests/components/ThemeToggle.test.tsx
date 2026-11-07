import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  test('is an accessible switch, off in light mode', () => {
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch', { name: 'Dark mode' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveAttribute('title', 'Switch to dark mode');
  });

  test('is on when the page is already dark', () => {
    document.documentElement.classList.add('dark');
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveAttribute('title', 'Switch to light mode');
  });

  test('clicking switches to dark mode and remembers it', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('clicking again goes back to light mode', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('works with the keyboard', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.tab();
    expect(screen.getByRole('switch')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  test('two toggles on one page stay in sync', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeToggle />
        <ThemeToggle />
      </>,
    );
    const [first, second] = screen.getAllByRole('switch');
    await user.click(first);
    expect(second).toHaveAttribute('aria-checked', 'true');
  });

  test('does not animate on first paint, only after a click', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const toggle = screen.getByRole('switch');
    expect(toggle.className).toContain('transition-none');
    await user.click(toggle);
    expect(toggle.className).toContain('duration-300');
    expect(toggle.className).not.toContain('transition-none');
  });

  test('accepts an extra class name', () => {
    render(<ThemeToggle className="ml-4" />);
    expect(screen.getByRole('switch').className).toContain('ml-4');
  });
});
