import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttentionPanel } from '@/components/dashboard/AttentionPanel';
import { attentionItems } from '@/components/dashboard/attentionItems';
import { ConsumablesPanel } from '@/components/dashboard/ConsumablesPanel';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/DashboardStates';
import { EquipmentPanel } from '@/components/dashboard/EquipmentPanel';
import { NextSessionPanel } from '@/components/dashboard/NextSessionPanel';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { RequestsPanel } from '@/components/dashboard/RequestsPanel';
import { Readout } from '@/components/dashboard/Readout';
import { RoomsTimeline } from '@/components/dashboard/RoomsTimeline';
import type { ConsumableItem } from '@/lib/dashboardTypes';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { makeDashboard } from '../../dashboardData';

const NOW = new Date(2026, 10, 5, 12);
const iso = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
const base = makeDashboard();

const item = (over: Partial<ConsumableItem>): ConsumableItem => ({
  consumableId: 1, name: 'Ethanol', unit: 'L', currentStock: 1, reorderThreshold: 4, expiryDate: null, daysLeft: null, expiry: null, hazards: [], ...over,
});

describe('Readout', () => {
  it('shows the value and label, as a link when given a href', () => {
    render(<Readout value={7} label="blocked requests" href="/requests" />);
    expect(screen.getByRole('link', { name: /7 blocked requests/ })).toHaveAttribute('href', '/requests');
  });
});

describe('NextSessionPanel', () => {
  it('says there is nothing planned when there is no session', () => {
    render(<NextSessionPanel session={null} now={NOW} />);
    expect(screen.getByText('Nothing booked')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/labsessions/new');
  });

  it('shows day, time range, room and status', () => {
    const session = { labSessionId: 1, name: 'Optics lab', status: 'approved', start: iso(5, 14), end: iso(5, 16), room: { roomId: 2, name: 'Room B1' } };
    render(<NextSessionPanel session={session} now={NOW} />);
    expect(screen.getByText('Optics lab')).toBeInTheDocument();
    expect(screen.getByText('Today · 14:00–16:00')).toBeInTheDocument();
    expect(screen.getByText('Room B1 · Approved')).toBeInTheDocument();
  });
});

describe('RequestsPanel', () => {
  it('shows an empty note when there are no requests', () => {
    render(<RequestsPanel requests={base.me.requests} />);
    expect(screen.getByText('No requests yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New request' })).toHaveAttribute('href', '/requests/new');
  });

  it('shows the open total and only the statuses that have requests', () => {
    const requests = { active: 3, counts: { ...base.me.requests.counts, open: 2, blocked: 1, completed: 9 } };
    render(<RequestsPanel requests={requests} />);
    expect(screen.getByText(/still open of/)).toHaveTextContent('3 still open of 12 in total');
    const chips = within(screen.getByRole('list')).getAllByRole('listitem').map((li) => li.textContent);
    expect(chips).toEqual(['Open 2', 'Blocked 1', 'Completed 9']);
  });
});

describe('NotificationsPanel', () => {
  it('says all caught up when there is nothing unread', () => {
    render(<NotificationsPanel notifications={{ unread: 0, latest: [] }} now={NOW} />);
    expect(screen.getByText('All caught up')).toBeInTheDocument();
  });

  it('lists the newest unread with the unread count in the label', () => {
    const latest = [{ notificationId: 1, message: 'Your session was approved', notifType: 'status_change', createdAt: iso(5, 9), requestId: null, labSessionId: 4 }];
    render(<NotificationsPanel notifications={{ unread: 3, latest }} now={NOW} />);
    expect(screen.getByLabelText('Unread · 3')).toBeInTheDocument();
    expect(screen.getByText('Your session was approved')).toBeInTheDocument();
    expect(screen.getByText('Today 09:00')).toBeInTheDocument();
  });
});

describe('AttentionPanel', () => {
  it('shows only the parts present for the role', () => {
    const ta = attentionItems({ requests: { unassigned: 2, blocked: 0, assignedToMe: 1, underMaintenance: [] } });
    expect(ta.map((i) => i.label)).toEqual(['requests nobody has picked up', 'blocked requests', 'assigned to you']);
    const manager = attentionItems({
      requests: { unassigned: 0, blocked: 0, assignedToMe: 0, underMaintenance: [] }, pendingSessions: 4, newMembers: 2,
    });
    expect(manager.map((i) => i.label)).toContain('sessions waiting for approval');
    expect(manager.map((i) => i.label)).toContain('new members this week');
  });

  it('colours a non-zero blocked count as an alert and lists equipment under maintenance', () => {
    render(<AttentionPanel attention={{ requests: { unassigned: 0, blocked: 2, assignedToMe: 0, underMaintenance: [{ equipmentId: 1, name: 'Oscilloscope' }] } }} />);
    expect(screen.getByText('blocked requests').previousSibling).toHaveClass('text-[#b3261e]');
    expect(screen.getByText(/Under maintenance: Oscilloscope/)).toBeInTheDocument();
  });
});

describe('ConsumablesPanel', () => {
  it('says all is well when nothing is low or expiring', () => {
    render(<ConsumablesPanel consumables={{ ...base.lab.consumables, total: 12 }} />);
    expect(screen.getByText('Stock levels are fine')).toBeInTheDocument();
    expect(screen.getByText(/12 items tracked/)).toBeInTheDocument();
  });

  it('lists low stock with hazards and expiry with wording for expired and soon', () => {
    const lowStock = { total: 1, items: [item({ name: 'Nitric acid', hazards: ['Corrosive'], currentStock: 0 })] };
    const expiring = {
      total: 2,
      items: [item({ consumableId: 2, name: 'Old gel', expiry: 'expired', daysLeft: -2 }), item({ consumableId: 3, name: 'Fresh gel', expiry: 'soon', daysLeft: 10 })],
    };
    render(<ConsumablesPanel consumables={{ total: 3, lowStock, expiring }} />);
    expect(screen.getByText('Nitric acid')).toBeInTheDocument();
    expect(screen.getByText('Corrosive')).toBeInTheDocument();
    expect(screen.getByText('0 / 4 L')).toBeInTheDocument();
    expect(screen.getByText('expired 2 days ago')).toBeInTheDocument();
    expect(screen.getByText('expires in 10 days')).toBeInTheDocument();
  });
});

describe('EquipmentPanel', () => {
  it('handles an empty catalogue', () => {
    render(<EquipmentPanel equipment={base.lab.equipment} />);
    expect(screen.getByText('No equipment yet')).toBeInTheDocument();
  });

  it('shows units and the kinds that are all in use, with "and N more"', () => {
    const equipment = { kinds: 5, unitsAvailable: 3, unitsTotal: 9, allTaken: { total: 3, items: [{ equipmentId: 1, name: 'Laser' }, { equipmentId: 2, name: 'Scope' }] } };
    render(<EquipmentPanel equipment={equipment} />);
    expect(screen.getByRole('meter', { name: 'Equipment in use' })).toHaveAttribute('aria-valuenow', '6');
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('All in use: Laser, Scope and 1 more')).toBeInTheDocument();
  });
});

describe('RoomsTimeline', () => {
  const window = { from: new Date(2026, 10, 5), to: new Date(2026, 10, 6) };

  it('shows each room with its bookings as times only and whether it is in use', () => {
    const rooms = { from: '', to: '', rooms: [
      { roomId: 1, name: 'Room A', inUseNow: true, busy: [{ start: iso(5, 11), end: iso(5, 13) }] },
      { roomId: 2, name: 'Room B', inUseNow: false, busy: [] },
    ] };
    render(<RoomsTimeline rooms={rooms} window={window} now={NOW} />);
    expect(screen.getByText('In use now')).toBeInTheDocument();
    expect(screen.getByText('Free now')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Room A bookings today: 11:00–13:00' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Room B bookings today: none' })).toBeInTheDocument();
  });

  it('shows a note when there are no rooms', () => {
    render(<RoomsTimeline rooms={base.lab.rooms} window={window} now={NOW} />);
    expect(screen.getByText('No rooms yet')).toBeInTheDocument();
  });
});

describe('states', () => {
  it('shows a loading status', () => {
    render(<DashboardSkeleton />);
    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
  });

  it('shows the error and retries on click', async () => {
    const onRetry = vi.fn();
    render(<DashboardError message="Could not reach the server" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the server');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe('ConsumablesPanel when nothing is tracked', () => {
  it('says nothing is tracked yet', () => {
    render(<ConsumablesPanel consumables={base.lab.consumables} />);
    expect(screen.getByText('No consumables tracked')).toBeInTheDocument();
  });
});

describe('EquipmentPanel with something free of every kind', () => {
  it('says every kind has a unit free', () => {
    render(<EquipmentPanel equipment={{ kinds: 2, unitsAvailable: 2, unitsTotal: 2, allTaken: { total: 0, items: [] } }} />);
    expect(screen.getByText('Every kind has at least one unit free.')).toBeInTheDocument();
  });
});
