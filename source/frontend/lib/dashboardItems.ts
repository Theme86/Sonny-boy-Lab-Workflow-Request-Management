// lib/dashboardItems.ts — the single rows inside GET /api/dashboard: consumables, sessions, notifications.
// Request and room rows are in dashboardRequestItems.ts.
export interface ConsumableItem {
  consumableId: number;
  name: string;
  unit: string;
  currentStock: number;
  reorderThreshold: number;
  expiryDate: string | null;
  daysLeft: number | null;
  expiry: 'expired' | 'soon' | null;
  hazards: string[];
}
export interface UpcomingSession {
  labSessionId: number;
  name: string;
  status: string;
  start: string;
  end: string;
  room: { roomId: number; name: string };
}
export interface NotificationItem {
  notificationId: number;
  message: string;
  notifType: string;
  createdAt: string;
  requestId: number | null;
  labSessionId: number | null;
}

export type * from '@/lib/dashboardRequestItems';
