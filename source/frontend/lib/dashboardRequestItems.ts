// lib/dashboardRequestItems.ts — request, pending-session and room rows inside GET /api/dashboard.
import type { RequestStatus } from '@/lib/dashboardTypes';

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
