// The Home page: what it asks the server for, and what each role ends up seeing.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DashboardPage from '@/app/dashboard/page';
import type { User } from '@/lib/users';
import { makeUser } from '../helpers';
import { makeDashboard, noPendingSessions, quietRequests } from '../dashboardData';

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/fonts');

let me: User | null = null;
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ user: me }) }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));


beforeEach(() => {
  apiFetch.mockReset();
  me = makeUser({ firstName: 'Ada' });
  apiFetch.mockResolvedValue(makeDashboard());
});

describe('Home', () => {
  test('renders nothing until the user is known', () => {
    me = null;
    const { container } = render(<DashboardPage />);
    expect(container).toBeEmptyDOMElement();
  });

  test('asks for the lab day in the browser\'s own time and shows a loading state first', async () => {
    render(<DashboardPage />);
    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
    await screen.findByLabelText('Upcoming sessions');

    const url = new URL(String(apiFetch.mock.calls[0][0]), 'http://x');
    expect(url.pathname).toBe('/api/dashboard');
    const [from, to] = [new Date(url.searchParams.get('from')!), new Date(url.searchParams.get('to')!)];
    expect([from.getHours(), to.getHours()]).toEqual([7, 21]);
  });

  test('says "Today" with the role, not a greeting', async () => {
    render(<DashboardPage />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Today');
    expect(screen.getByText(/· Lab Member$/)).toBeInTheDocument();
  });

  test('a member sees their own work and the lab, but no staff queues', async () => {
    render(<DashboardPage />);
    for (const label of ['Upcoming sessions', 'My requests', 'Rooms today', 'Unread', 'Stock to check', 'Fully booked equipment']) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText('Requests nobody has picked up')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Waiting for your approval')).not.toBeInTheDocument();
  });

  const sectionOrder = () => screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'));

  test.each([
    ['ta', { requests: quietRequests() }, 'Requests nobody has picked up', ['Waiting for your approval']],
    ['lecturer', { requests: quietRequests(), pendingSessions: noPendingSessions() }, 'Waiting for your approval', []],
    ['lab_manager', { requests: quietRequests(), pendingSessions: noPendingSessions(), newMembers: 3 }, 'Rooms today', []],
  ] as const)('%s sees its own queue first and nothing it may not act on', async (role, attention, first, hidden) => {
    me = makeUser({ role });
    apiFetch.mockResolvedValue(makeDashboard({ role, attention }));
    render(<DashboardPage />);
    await screen.findByLabelText('Upcoming sessions');
    expect(sectionOrder()[0]).toBe(first);
    for (const label of hidden) expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
  });

  test('the lab manager sees how many members joined this week', async () => {
    me = makeUser({ role: 'lab_manager' });
    apiFetch.mockResolvedValue(makeDashboard({ role: 'lab_manager', attention: { requests: quietRequests(), pendingSessions: noPendingSessions(), newMembers: 3 } }));
    render(<DashboardPage />);
    expect(await screen.findByText(/new members joined this week/)).toHaveTextContent('3 new members joined this week.');
    expect(screen.getByRole('link', { name: 'Manage users' })).toHaveAttribute('href', '/users');
  });

  test('shows the error and loads again when "Try again" is clicked', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Could not reach the server'));
    render(<DashboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByLabelText('Upcoming sessions')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
