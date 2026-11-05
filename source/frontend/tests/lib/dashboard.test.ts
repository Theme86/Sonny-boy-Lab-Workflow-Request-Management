import { afterEach, describe, expect, it, vi } from 'vitest';
import { dayLabel, daysText, formatRange, greeting, percentOfWindow } from '@/lib/dashboardTime';
import { fetchDashboard, localDayWindow } from '@/lib/dashboard';
import { jsonResponse } from '../helpers';

afterEach(() => vi.unstubAllGlobals());

describe('localDayWindow', () => {
  it('runs from local midnight to the next local midnight', () => {
    const { from, to } = localDayWindow(new Date(2026, 10, 5, 15, 30));
    expect(from).toEqual(new Date(2026, 10, 5, 0, 0));
    expect(to).toEqual(new Date(2026, 10, 6, 0, 0));
  });
});

describe('fetchDashboard', () => {
  it('sends the window as from and to', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ role: 'member' }));
    vi.stubGlobal('fetch', fetchMock);
    const window = localDayWindow(new Date(2026, 10, 5));
    await fetchDashboard(window);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/dashboard');
    expect(url.searchParams.get('from')).toBe(window.from.toISOString());
    expect(url.searchParams.get('to')).toBe(window.to.toISOString());
  });
});

describe('formatting', () => {
  it('formats a time range in 24-hour time', () => {
    expect(formatRange(new Date(2026, 10, 5, 9, 5).toISOString(), new Date(2026, 10, 5, 13, 0).toISOString())).toBe('09:05–13:00');
  });

  it('labels today, tomorrow and later days', () => {
    const now = new Date(2026, 10, 5, 12);
    expect(dayLabel(new Date(2026, 10, 5, 18).toISOString(), now)).toBe('Today');
    expect(dayLabel(new Date(2026, 10, 6, 8).toISOString(), now)).toBe('Tomorrow');
    expect(dayLabel(new Date(2026, 10, 9, 8).toISOString(), now)).toMatch(/Mon/);
  });

  it('words a number of days', () => {
    expect([0, 1, -1, 5, -3].map(daysText)).toEqual(['today', 'tomorrow', 'yesterday', 'in 5 days', '3 days ago']);
  });

  it('greets by time of day', () => {
    expect([8, 14, 21].map((h) => greeting(new Date(2026, 10, 5, h)))).toEqual(['Good morning', 'Good afternoon', 'Good evening']);
  });
});

describe('percentOfWindow', () => {
  const window = localDayWindow(new Date(2026, 10, 5));
  it('gives the position inside the day and clamps outside it', () => {
    expect(percentOfWindow(new Date(2026, 10, 5, 12).toISOString(), window)).toBeCloseTo(50);
    expect(percentOfWindow(new Date(2026, 10, 4, 12).toISOString(), window)).toBe(0);
    expect(percentOfWindow(new Date(2026, 10, 7).toISOString(), window)).toBe(100);
  });
});
