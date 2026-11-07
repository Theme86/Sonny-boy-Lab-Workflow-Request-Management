// lib/dashboardWindow.ts — maths on the day window the room timeline shows.
import type { DayWindow } from '@/lib/dashboardTypes';

const HOUR_MS = 3600000;

/** Position of a time inside the window as a 0..100 percentage (clamped), for the room timeline. */
export function percentOfWindow(iso: string, { from, to }: DayWindow): number {
  const span = to.getTime() - from.getTime();
  const at = (new Date(iso).getTime() - from.getTime()) / span;
  return Math.min(100, Math.max(0, at * 100));
}

/** The whole hours a window covers, e.g. 7..20 for 07:00–21:00 (one label per column). */
export function windowHours({ from, to }: DayWindow): number[] {
  const count = Math.round((to.getTime() - from.getTime()) / HOUR_MS);
  return Array.from({ length: count }, (_, i) => new Date(from.getTime() + i * HOUR_MS).getHours());
}
