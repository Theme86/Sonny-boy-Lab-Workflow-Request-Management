// components/dashboard/sectionOrder.ts — which sections each role sees first in the main column.
// Work you can act on comes first (like the Alerts panel in lab booking systems); the lab manager starts from the rooms.
// A section whose data the server did not send (because of the role) is simply skipped by the view.
import type { Role } from '@/lib/users';

export type MainSection = 'alerts' | 'approvals' | 'requestQueue' | 'rooms' | 'sessions' | 'myRequests';

const ORDER: Record<Role, MainSection[]> = {
  member: ['alerts', 'sessions', 'myRequests', 'rooms'],
  ta: ['requestQueue', 'rooms', 'sessions', 'myRequests'],
  lecturer: ['approvals', 'requestQueue', 'rooms', 'sessions', 'myRequests'],
  lab_manager: ['rooms', 'approvals', 'requestQueue', 'sessions', 'myRequests'],
};

export const mainSections = (role: Role): MainSection[] => ORDER[role] ?? ORDER.member;
