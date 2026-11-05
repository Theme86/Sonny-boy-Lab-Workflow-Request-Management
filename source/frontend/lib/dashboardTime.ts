// lib/dashboardTime.ts — turning times and day counts into the short text the dashboard shows.
import type { DayWindow } from '@/lib/dashboardTypes';

const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
const DAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const formatTime = (iso: string) => TIME.format(new Date(iso));
export const formatDay = (iso: string) => DAY.format(new Date(iso));
export const formatRange = (start: string, end: string) => `${formatTime(start)}–${formatTime(end)}`;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "Today", "Tomorrow" or "Fri 6 Nov". */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (sameDay(date, now)) return 'Today';
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return sameDay(date, tomorrow) ? 'Tomorrow' : formatDay(iso);
}

/** "in 3 days", "tomorrow", "expired 2 days ago" … from a whole number of days. */
export function daysText(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/** Position of a time inside the window as a 0..100 percentage (clamped), for the room timeline. */
export function percentOfWindow(iso: string, { from, to }: DayWindow): number {
  const span = to.getTime() - from.getTime();
  const at = (new Date(iso).getTime() - from.getTime()) / span;
  return Math.min(100, Math.max(0, at * 100));
}

const GREETINGS = [
  { before: 12, text: 'Good morning' },
  { before: 18, text: 'Good afternoon' },
  { before: 24, text: 'Good evening' },
];
export const greeting = (now: Date = new Date()) => GREETINGS.find((g) => now.getHours() < g.before)!.text;
