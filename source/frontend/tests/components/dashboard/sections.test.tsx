// The dashboard sections: what they show with data, and the one-line message they show without.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApprovalQueue } from '@/components/dashboard/ApprovalQueue';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/DashboardStates';
import { EquipmentNote } from '@/components/dashboard/EquipmentNote';
import { MemberAlerts, memberAlerts } from '@/components/dashboard/MemberAlerts';
import { Notifications } from '@/components/dashboard/Notifications';
import { RecentRequests } from '@/components/dashboard/RecentRequests';
import { RequestQueue } from '@/components/dashboard/RequestQueue';
import { RoomTimeline } from '@/components/dashboard/RoomTimeline';
import { mainSections } from '@/components/dashboard/sectionOrder';
import { StatusLine, statusFacts } from '@/components/dashboard/StatusLine';
import { StatusText, statusLabel } from '@/components/dashboard/StatusText';
import { expiryText, stockText, StockWatch } from '@/components/dashboard/StockWatch';
import { UpcomingSessions } from '@/components/dashboard/UpcomingSessions';
import type { ConsumableItem } from '@/lib/dashboardTypes';
import { makeDashboard, quietRequests } from '../../dashboardData';

const NOW = new Date(2026, 10, 5, 12);
const iso = (day: number, hour: number) => new Date(2026, 10, day, hour).toISOString();
const base = makeDashboard();
const counts = base.me.requests.counts;

const consumable = (over: Partial<ConsumableItem>): ConsumableItem => ({
  consumableId: 1, name: 'Ethanol', unit: 'L', currentStock: 1, reorderThreshold: 4, expiryDate: null, daysLeft: null, expiry: null, hazards: [], ...over,
});

describe('DashboardHeader', () => {
  it('says what today is, the role, and offers the two main actions', () => {
    render(<DashboardHeader role="lab_manager" now={NOW} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Thursday 5 November · Lab Manager')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Quick actions' });
    expect(within(nav).getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/labsessions/new');
    expect(within(nav).getByRole('link', { name: 'New request' })).toHaveAttribute('href', '/requests/new');
  });
});

describe('StatusLine', () => {
  it('says "none yet" instead of 0 / 0', () => {
    expect(statusFacts(base)).toEqual([['Rooms in use', 'none yet'], ['Equipment free', 'none yet'], ['Unread', '0'], ['Updated', expect.any(String)]]);
  });

  it('counts rooms in use and free equipment', () => {
    const data = makeDashboard();
    data.lab.rooms.rooms = [{ roomId: 1, name: 'A', inUseNow: true, busy: [] }, { roomId: 2, name: 'B', inUseNow: false, busy: [] }];
    data.lab.equipment = { kinds: 2, unitsAvailable: 3, unitsTotal: 5, allTaken: { total: 0, items: [] } };
    render(<StatusLine data={data} />);
    expect(screen.getByText('Rooms in use').nextSibling).toHaveTextContent('1 / 2');
    expect(screen.getByText('Equipment free').nextSibling).toHaveTextContent('3 / 5');
  });
});

describe('StatusText', () => {
  it('writes the status as a word for requests and sessions', () => {
    expect(statusLabel('pending_approval', 'session')).toBe('Waiting for approval');
    expect(statusLabel('in_review', 'request')).toBe('In review');
    expect(statusLabel('mystery', 'request')).toBe('mystery');
  });

  it('colours only statuses that need attention', () => {
    const { rerender } = render(<StatusText status="rejected" kind="request" />);
    expect(screen.getByText('Rejected')).toHaveClass('text-[#b3261e]');
    rerender(<StatusText status="closed" kind="request" />);
    expect(screen.getByText('Closed')).toHaveClass('text-vl-muted');
  });
});

describe('UpcomingSessions', () => {
  it('offers to book when there are none', () => {
    render(<UpcomingSessions sessions={[]} now={NOW} />);
    expect(screen.getByText(/You have no sessions booked/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/labsessions/new');
  });

  it('lists day, time, name, room and status', () => {
    render(<UpcomingSessions sessions={[{ labSessionId: 1, name: 'Optics', status: 'approved', start: iso(5, 14), end: iso(5, 16), room: { roomId: 2, name: 'Room B1' } }]} now={NOW} />);
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('Today');
    expect(row).toHaveTextContent('14:00–16:00');
    expect(row).toHaveTextContent('Optics');
    expect(row).toHaveTextContent('Room B1');
    expect(row).toHaveTextContent('Approved');
  });
});

describe('RecentRequests', () => {
  it('offers a new request when there are none', () => {
    render(<RecentRequests requests={[]} active={0} now={NOW} />);
    expect(screen.getByRole('link', { name: 'New request' })).toHaveAttribute('href', '/requests/new');
  });

  it('links each row to the request and shows the open count', () => {
    render(<RecentRequests requests={[{ requestId: 31, title: 'Fix laser', type: 'maintenance', status: 'blocked', createdAt: iso(5, 9) }]} active={3} now={NOW} />);
    expect(screen.getByRole('heading', { name: /My requests/ })).toHaveTextContent('My requests3');
    const link = screen.getByRole('link', { name: /Fix laser/ });
    expect(link).toHaveAttribute('href', '/requests/31');
    expect(link).toHaveTextContent('#31');
    expect(link).toHaveTextContent('Maintenance · Today');
    expect(link).toHaveTextContent('Blocked');
  });
});

describe('MemberAlerts', () => {
  it('renders nothing when no request is blocked or rejected', () => {
    const { container } = render(<MemberAlerts counts={{ ...counts, open: 3 }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('words blocked and rejected requests, singular and plural', () => {
    expect(memberAlerts({ ...counts, blocked: 1, rejected: 2 }).map((a) => a.text)).toEqual([
      '1 request is blocked and may need more information from you',
      '2 requests were rejected',
    ]);
    render(<MemberAlerts counts={{ ...counts, rejected: 1 }} />);
    expect(screen.getByRole('region', { name: 'Needs your attention' })).toHaveTextContent('1 request was rejected.');
  });
});

describe('ApprovalQueue', () => {
  it('says nothing is waiting', () => {
    render(<ApprovalQueue queue={{ total: 0, items: [] }} now={NOW} />);
    expect(screen.getByText('No sessions are waiting for approval.')).toBeInTheDocument();
  });

  it('lists waiting sessions with who asked and links to review', () => {
    const items = [{ labSessionId: 7, name: 'Interferometer', start: iso(6, 10), end: iso(6, 12), roomName: 'Optics bay', requestedBy: 'Somchai J' }];
    render(<ApprovalQueue queue={{ total: 4, items }} now={NOW} />);
    expect(screen.getByRole('heading', { name: /Waiting for your approval/ })).toHaveTextContent('4');
    expect(screen.getByRole('listitem')).toHaveTextContent('Tomorrow10:00–12:00InterferometerOptics baySomchai J');
    expect(screen.getByRole('link', { name: 'Review' })).toHaveAttribute('href', '/labsessions');
  });
});

describe('RequestQueue', () => {
  it('says everything is picked up, and still shows the summary line', () => {
    render(<RequestQueue requests={quietRequests()} now={NOW} />);
    expect(screen.getByText('Every open request has someone on it.')).toBeInTheDocument();
    expect(screen.getByText(/Assigned to you 0/)).toBeInTheDocument();
  });

  it('lists the oldest unassigned requests with their age, high priority and repairs', () => {
    const requests = {
      ...quietRequests(),
      unassigned: { total: 1, items: [{ requestId: 22, title: 'Fume hood alarm', type: 'maintenance', priority: 'high', createdAt: iso(3, 12) }] },
      blocked: 2,
      underMaintenance: [{ equipmentId: 1, name: 'OSC-02' }],
    };
    render(<RequestQueue requests={requests} now={NOW} />);
    const link = screen.getByRole('link', { name: /Fume hood alarm/ });
    expect(link).toHaveAttribute('href', '/requests/22');
    expect(link).toHaveTextContent('high priority');
    expect(link).toHaveTextContent('2 d');
    expect(screen.getByText('Blocked 2')).toHaveClass('text-[#b3261e]');
    expect(screen.getByText(/Under maintenance: OSC-02/)).toBeInTheDocument();
  });
});

describe('RoomTimeline', () => {
  const window = { from: new Date(2026, 10, 5, 7), to: new Date(2026, 10, 5, 21) };

  it('says when there are no rooms', () => {
    render(<RoomTimeline rooms={base.lab.rooms} window={window} now={NOW} />);
    expect(screen.getByText('No rooms have been added yet.')).toBeInTheDocument();
  });

  it('draws one lane per room, described by its booked times', () => {
    const rooms = { from: '', to: '', rooms: [
      { roomId: 1, name: 'Room A', inUseNow: true, busy: [{ start: iso(5, 11), end: iso(5, 13) }] },
      { roomId: 2, name: 'Room B', inUseNow: false, busy: [] },
    ] };
    render(<RoomTimeline rooms={rooms} window={window} now={NOW} />);
    expect(screen.getByRole('img', { name: 'Room A: 11:00–13:00' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Room B: nothing booked' })).toBeInTheDocument();
    expect(screen.getByText('(in use now)')).toBeInTheDocument();
  });
});

describe('Notifications', () => {
  it('says there is nothing unread', () => {
    render(<Notifications notifications={{ unread: 0, latest: [] }} now={NOW} />);
    expect(screen.getByText('No unread notifications.')).toBeInTheDocument();
  });

  it('lists messages with their time', () => {
    const latest = [{ notificationId: 1, message: 'Session approved', notifType: 'status_change', createdAt: iso(5, 9), requestId: null, labSessionId: 4 }];
    render(<Notifications notifications={{ unread: 3, latest }} now={NOW} />);
    expect(screen.getByRole('heading', { name: /Unread/ })).toHaveTextContent('Unread3');
    expect(screen.getByRole('listitem')).toHaveTextContent('Today 09:00Session approved');
  });
});

describe('StockWatch', () => {
  it('words the two empty cases', () => {
    const { rerender } = render(<StockWatch consumables={base.lab.consumables} />);
    expect(screen.getByText('No consumables are tracked yet.')).toBeInTheDocument();
    rerender(<StockWatch consumables={{ ...base.lab.consumables, total: 12 }} />);
    expect(screen.getByText('All 12 consumables are above their reorder level and in date.')).toBeInTheDocument();
  });

  it('writes amounts with a space before the unit, and expiry in days', () => {
    expect(stockText(consumable({ currentStock: 0, reorderThreshold: 5, unit: 'L' }))).toBe('0 / 5 L');
    expect(expiryText(consumable({ expiry: 'expired', daysLeft: -2 }))).toBe('expired 2 days ago');
    expect(expiryText(consumable({ expiry: 'soon', daysLeft: 9 }))).toBe('expires in 9 days');
  });

  it('lists low and expiring items with hazards', () => {
    render(<StockWatch consumables={{ total: 5, lowStock: { total: 1, items: [consumable({ name: 'Nitric acid', hazards: ['Corrosive'] })] }, expiring: { total: 1, items: [consumable({ consumableId: 2, name: 'Gel', expiry: 'soon', daysLeft: 3 })] } }} />);
    expect(screen.getByRole('heading', { name: /Stock to check/ })).toHaveTextContent('2');
    expect(screen.getByText('Corrosive')).toBeInTheDocument();
    expect(screen.getByText('expires in 3 days')).toBeInTheDocument();
  });
});

describe('EquipmentNote', () => {
  it('words the empty and all-fine cases', () => {
    const { rerender } = render(<EquipmentNote equipment={base.lab.equipment} />);
    expect(screen.getByText('No equipment has been added yet.')).toBeInTheDocument();
    rerender(<EquipmentNote equipment={{ kinds: 2, unitsAvailable: 2, unitsTotal: 3, allTaken: { total: 0, items: [] } }} />);
    expect(screen.getByText('Every kind of equipment has at least one unit free.')).toBeInTheDocument();
  });

  it('lists fully booked kinds and how many more', () => {
    render(<EquipmentNote equipment={{ kinds: 9, unitsAvailable: 1, unitsTotal: 9, allTaken: { total: 3, items: [{ equipmentId: 1, name: 'Laser' }] } }} />);
    expect(screen.getByText('Laser')).toBeInTheDocument();
    expect(screen.getByText('and 2 more')).toBeInTheDocument();
  });
});

describe('mainSections', () => {
  it('puts the work each role acts on first', () => {
    expect(mainSections('member')[0]).toBe('alerts');
    expect(mainSections('ta')[0]).toBe('requestQueue');
    expect(mainSections('lecturer')[0]).toBe('approvals');
    expect(mainSections('lab_manager')[0]).toBe('rooms');
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
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
