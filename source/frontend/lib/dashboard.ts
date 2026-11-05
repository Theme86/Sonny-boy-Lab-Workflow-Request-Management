// lib/dashboard.ts — asking the server for the dashboard.
import { apiFetch } from '@/lib/api';
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';

/** From local midnight to the next local midnight — what "today" means for this browser. */
export function localDayWindow(now: Date = new Date()): DayWindow {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { from, to };
}

export function fetchDashboard({ from, to }: DayWindow): Promise<Dashboard> {
  const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  return apiFetch<Dashboard>(`/api/dashboard?${query}`);
}
