import { afterEach, describe, expect, it, vi } from 'vitest';
import { ageText, dayLabel, daysText, formatLongDay, formatRange, percentOfWindow, windowHours } from '@/lib/dashboardTime';
import { fetchDashboard, labDayWindow } from '@/lib/dashboard';
import { jsonResponse } from '../helpers';

afterEach(() => vi.unstubAllGlobals());

describe('labDayWindow', () => {
  it('covers 07:00 to 21:00 local time by default', () => {
    const { from, to } = labDayWindow(new Date(2026, 10, 5, 15, 30));
    expect(from).toEqual(new Date(2026, 10, 5, 7));
    expect(to).toEqual(new Date(2026, 10, 5, 21));
  });

  it('takes other lab hours', () => {
    const { from, to } = labDayWindow(new Date(2026, 10, 5), { startHour: 9, endHour: 17 });
    expect([from.getHours(), to.getHours()]).toEqual([9, 17]);
  });
});

describe('fetchDashboard', () => {
  it('sends the window as from and to', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ role: 'member' }));
    vi.stubGlobal('fetch', fetchMock);
    const window = labDayWindow(new Date(2026, 10, 5));
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

  it('writes the long date', () => {
    expect(formatLongDay(new Date(2026, 10, 5))).toBe('Thursday 5 November');
  });

  it('says how long ago in minutes, hours or days', () => {
    const now = new Date(2026, 10, 5, 12);
    const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
    expect(ageText(ago(10 * 60000), now)).toBe('10 min');
    expect(ageText(ago(5 * 3600000), now)).toBe('5 h');
    expect(ageText(ago(3 * 86400000), now)).toBe('3 d');
  });

  it('lists the hours a window covers', () => {
    expect(windowHours(labDayWindow(new Date(2026, 10, 5)))).toEqual([7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
});

describe('percentOfWindow', () => {
  const window = { from: new Date(2026, 10, 5), to: new Date(2026, 10, 6) };
  it('gives the position inside the day and clamps outside it', () => {
    expect(percentOfWindow(new Date(2026, 10, 5, 12).toISOString(), window)).toBeCloseTo(50);
    expect(percentOfWindow(new Date(2026, 10, 4, 12).toISOString(), window)).toBe(0);
    expect(percentOfWindow(new Date(2026, 10, 7).toISOString(), window)).toBe(100);
  });
});
