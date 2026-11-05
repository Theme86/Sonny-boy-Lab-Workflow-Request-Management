// components/dashboard/summaryReadouts.ts — the four numbers along the top of the dashboard, worked out from the response.
import type { Dashboard } from '@/lib/dashboardTypes';
import type { Channel, Tone } from './tones';

export interface SummaryReadout {
  label: string;
  value: string;
  caption: string;
  channel: Channel;
  tone: Tone;
  href: string;
}

const ratio = (part: number, whole: number) => (whole === 0 ? '—' : `${part}/${whole}`);

export function summaryReadouts({ me, lab }: Dashboard): SummaryReadout[] {
  const rooms = lab.rooms.rooms;
  const freeRooms = rooms.filter((room) => !room.inUseNow).length;
  const { unitsAvailable, unitsTotal } = lab.equipment;

  return [
    { label: 'Open requests', value: String(me.requests.active), caption: 'yours, not finished yet', channel: 'amber', tone: 'neutral', href: '/requests' },
    { label: 'Unread', value: String(me.notifications.unread), caption: 'notifications', channel: 'blue', tone: me.notifications.unread > 0 ? 'warn' : 'neutral', href: '#unread' },
    { label: 'Rooms free', value: ratio(freeRooms, rooms.length), caption: 'right now', channel: 'violet', tone: rooms.length > 0 && freeRooms === 0 ? 'warn' : 'neutral', href: '/rooms' },
    { label: 'Equipment', value: ratio(unitsAvailable, unitsTotal), caption: 'units available', channel: 'teal', tone: unitsTotal > 0 && unitsAvailable === 0 ? 'alert' : 'neutral', href: '/equipment' },
  ];
}
