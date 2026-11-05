// components/dashboard/attentionItems.ts — which readouts the "Needs attention" card has for this person.
// The server only sends the parts the role may act on, so a readout exists only when its number is present.
import type { Attention } from '@/lib/dashboardTypes';
import type { Tone } from './tones';

export interface Item {
  value: number;
  label: string;
  href: string;
  tone: Tone;
}

/** The readouts this person has, in the order they are shown. */
export function attentionItems(attention: Attention): Item[] {
  const { requests, pendingSessions, newMembers } = attention;
  const items: (Item | false)[] = [
    requests !== undefined && { value: requests.unassigned, label: 'requests nobody has picked up', href: '/requests', tone: requests.unassigned > 0 ? 'warn' : 'ok' },
    requests !== undefined && { value: requests.blocked, label: 'blocked requests', href: '/requests', tone: requests.blocked > 0 ? 'alert' : 'ok' },
    requests !== undefined && { value: requests.assignedToMe, label: 'assigned to you', href: '/requests', tone: 'neutral' },
    pendingSessions !== undefined && { value: pendingSessions, label: 'sessions waiting for approval', href: '/labsessions', tone: pendingSessions > 0 ? 'warn' : 'ok' },
    newMembers !== undefined && { value: newMembers, label: 'new members this week', href: '/users', tone: 'neutral' },
  ];
  return items.filter((item): item is Item => item !== false);
}
