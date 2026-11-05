import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { SummaryStrip } from '@/components/dashboard/SummaryStrip';
import { summaryReadouts } from '@/components/dashboard/summaryReadouts';
import { makeDashboard } from '../../dashboardData';

const busyLab = () => {
  const data = makeDashboard();
  data.me.requests.active = 4;
  data.me.notifications.unread = 2;
  data.lab.equipment = { kinds: 3, unitsAvailable: 0, unitsTotal: 5, allTaken: { total: 0, items: [] } };
  data.lab.rooms.rooms = [
    { roomId: 1, name: 'A', inUseNow: true, busy: [] },
    { roomId: 2, name: 'B', inUseNow: true, busy: [] },
  ];
  return data;
};

describe('summaryReadouts', () => {
  it('shows a dash instead of 0/0 when nothing exists yet', () => {
    const values = summaryReadouts(makeDashboard()).map((r) => [r.label, r.value]);
    expect(values).toEqual([['Open requests', '0'], ['Unread', '0'], ['Rooms free', '—'], ['Equipment', '—']]);
  });

  it('counts free rooms and warns when none are free or no equipment is left', () => {
    const readouts = summaryReadouts(busyLab());
    const by = Object.fromEntries(readouts.map((r) => [r.label, r]));
    expect(by['Rooms free'].value).toBe('0/2');
    expect(by['Rooms free'].tone).toBe('warn');
    expect(by.Equipment.value).toBe('0/5');
    expect(by.Equipment.tone).toBe('alert');
    expect(by.Unread.tone).toBe('warn');
  });
});

describe('SummaryStrip', () => {
  it('renders four linked readouts', () => {
    render(<SummaryStrip data={busyLab()} />);
    const items = within(screen.getByRole('list', { name: 'Summary' })).getAllByRole('link');
    expect(items.map((a) => a.getAttribute('href'))).toEqual(['/requests', '#unread', '/rooms', '/equipment']);
    expect(items[0]).toHaveTextContent('Open requests4');
  });
});

describe('DashboardHeader', () => {
  it('offers the two quick actions', () => {
    render(<DashboardHeader firstName="Ada" role="ta" now={new Date(2026, 10, 5, 9)} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Good morning, Ada');
    expect(screen.getByText('Teaching Assistant')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Quick actions' });
    expect(within(nav).getByRole('link', { name: 'New request' })).toHaveAttribute('href', '/requests/new');
    expect(within(nav).getByRole('link', { name: 'Book a session' })).toHaveAttribute('href', '/labsessions/new');
  });

  it('falls back to "there" without a first name', () => {
    render(<DashboardHeader firstName="" role="member" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, there$/);
  });
});

describe('EmptyState', () => {
  it('shows title, body and an optional action, with the drawing hidden from screen readers', () => {
    const { container } = render(<EmptyState art="damped" title="All quiet" body="Nothing here." action={{ href: '/x', label: 'Do it' }} />);
    expect(screen.getByText('All quiet')).toBeInTheDocument();
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Do it' })).toHaveAttribute('href', '/x');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no link without an action', () => {
    render(<EmptyState art="flat" title="Empty" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
