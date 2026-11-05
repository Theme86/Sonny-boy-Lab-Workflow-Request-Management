// lib/dashboard.ts — asking the server for the dashboard, and which window of today it covers.
import { apiFetch } from '@/lib/api';
import type { DayWindow, Dashboard } from '@/lib/dashboardTypes';

/** The lab day the room timeline covers, in this browser's time: 07:00 to 21:00 by default. */
export const LAB_DAY = { startHour: 7, endHour: 21 };

export function labDayWindow(now: Date = new Date(), { startHour, endHour } = LAB_DAY): DayWindow {
  const at = (hour: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
  return { from: at(startHour), to: at(endHour) };
}

export function fetchDashboard({ from, to }: DayWindow): Promise<Dashboard> {
  const query = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  return apiFetch<Dashboard>(`/api/dashboard?${query}`);
}
