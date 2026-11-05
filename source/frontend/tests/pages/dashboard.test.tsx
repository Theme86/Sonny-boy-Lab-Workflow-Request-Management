// The Home page: what it asks the server for, and what each role ends up seeing.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import DashboardPage from '@/app/dashboard/page';
import type { User } from '@/lib/users';
import { makeUser } from '../helpers';
import { makeDashboard } from '../dashboardData';

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/fonts');

let me: User | null = null;
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ user: me }) }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

const noRequests = { unassigned: 0, blocked: 0, assignedToMe: 0, underMaintenance: [] };

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

  test('asks for today in the browser\'s own time and shows a loading state first', async () => {
    render(<DashboardPage />);
    expect(screen.getByRole('status', { name: 'Loading dashboard' })).toBeInTheDocument();
    await screen.findByLabelText('Next session');

    const url = new URL(String(apiFetch.mock.calls[0][0]), 'http://x');
    expect(url.pathname).toBe('/api/dashboard');
    const [from, to] = [url.searchParams.get('from')!, url.searchParams.get('to')!];
    expect(new Date(from).getHours()).toBe(0);
    expect(new Date(to).getTime() - new Date(from).getTime()).toBeGreaterThanOrEqual(23 * 3600000);
  });

  test('greets by first name and shows the role', async () => {
    render(<DashboardPage />);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Good (morning|afternoon|evening), Ada/);
    expect(screen.getByText('Lab Member')).toBeInTheDocument();
  });

  test('a member sees their own work and the lab status, but no "Needs attention"', async () => {
    render(<DashboardPage />);
    for (const label of ['Next session', 'My requests', 'Unread', 'Rooms today', 'Equipment', 'Consumables']) {
      expect(await screen.findByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText('Needs attention')).not.toBeInTheDocument();
  });

  test.each([
    ['ta', { requests: noRequests }, ['assigned to you'], ['sessions waiting for approval', 'new members this week']],
    ['lecturer', { requests: noRequests, pendingSessions: 2 }, ['sessions waiting for approval'], ['new members this week']],
    ['lab_manager', { requests: noRequests, pendingSessions: 2, newMembers: 3 }, ['sessions waiting for approval', 'new members this week'], []],
  ] as const)('%s sees exactly the attention items the server sent', async (role, attention, shown, hidden) => {
    me = makeUser({ role });
    apiFetch.mockResolvedValue(makeDashboard({ role, attention }));
    render(<DashboardPage />);
    await screen.findByLabelText('Needs attention');
    for (const label of shown) expect(screen.getByText(label)).toBeInTheDocument();
    for (const label of hidden) expect(screen.queryByText(label)).not.toBeInTheDocument();
  });

  test('shows the error and loads again when "Try again" is clicked', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Could not reach the server'));
    render(<DashboardPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(await screen.findByLabelText('Next session')).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });
});
