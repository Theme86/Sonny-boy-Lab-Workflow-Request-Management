// lib/notifications.ts — types and small helpers for the notification bell.
// The data comes from /api/notifications (backend/routes/notificationRoutes.js).

export type NotifType = 'status_change' | 'approval_needed' | 'new_comment' | 'reminder' | 'low_stock';

export type NotificationRow = {
  notificationId: number;
  requestId: number | null;
  labSessionId: number | null;
  consumableId: number | null;
  message: string;
  notifType: NotifType | null;
  isRead: boolean;
  createdAt: string;
  request: { requestId: number; title: string; status: string } | null;
  session: { labSessionId: number; name: string; status: string } | null;
  consumable: { consumableId: number; name: string } | null;
};

/** One page of the list; nextCursor is the id to pass as ?before= for the next page (null = no more). */
export type NotificationListResponse = {
  items: NotificationRow[];
  nextCursor: number | null;
};

export const NOTIFICATION_PAGE_SIZE = 15;
/** How often the unread number is refreshed while the tab is visible. */
export const NOTIFICATION_POLL_MS = 30_000;

export const TYPE_LABELS: Record<NotifType, string> = {
  status_change: 'Update',
  approval_needed: 'Needs approval',
  new_comment: 'New comment',
  reminder: 'Reminder',
  low_stock: 'Low stock',
};

/** Where clicking a notification goes. There is no page for a single lab session or consumable, so it opens the list. */
export function notificationHref(n: Pick<NotificationRow, 'requestId' | 'labSessionId' | 'consumableId'>): string | null {
  if (n.requestId != null) return `/requests/${n.requestId}`;
  if (n.labSessionId != null) return '/labsessions';
  if (n.consumableId != null) return '/consumables';
  return null;
}

/** "just now", "5 min ago", "3 h ago", "2 d ago", then the date. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (Number.isNaN(minutes) || minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;
  return then.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The number on the bell: 1 to 99, then "99+". */
export function badgeText(count: number): string {
  return count > 99 ? '99+' : String(count);
}