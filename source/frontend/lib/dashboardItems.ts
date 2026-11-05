// lib/dashboardItems.ts — the single rows inside GET /api/dashboard (a session, a request, a room…).
import type { RequestStatus } from '@/lib/dashboardTypes';

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
export interface RecentRequest {
  requestId: number;
  title: string;
  type: string;
  status: RequestStatus;
  createdAt: string;
}
export interface QueuedRequest {
  requestId: number;
  title: string;
  type: string;
  priority: string | null;
  createdAt: string;
}
export interface PendingSession {
  labSessionId: number;
  name: string;
  start: string;
  end: string;
  roomName: string;
  requestedBy: string;
}
export interface BusyInterval {
  start: string;
  end: string;
}
export interface RoomStatus {
  roomId: number;
  name: string;
  busy: BusyInterval[];
  inUseNow: boolean;
}
