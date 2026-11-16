// lib/notificationFormat.ts — where a notification links to, and the number on the bell.
import type { NotificationRow } from './notificationTypes';

/** Where clicking a notification goes. There is no page for a single lab session or consumable, so it opens the list. */
export function notificationHref(n: Pick<NotificationRow, 'requestId' | 'labSessionId' | 'consumableId'>): string | null {
  if (n.requestId != null) return `/requests/${n.requestId}`;
  if (n.labSessionId != null) return '/labsessions';
  if (n.consumableId != null) return '/consumables';
  return null;
}

/** The number on the bell: 1 to 99, then "99+". */
export function badgeText(count: number): string {
  return count > 99 ? '99+' : String(count);
}