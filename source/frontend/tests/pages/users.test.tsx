// The Lab Manager's user-management page: access, listing, filters, sorting, paging, role / status changes.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import UsersPage from '@/app/users/page';
import type { User, UserListResponse } from '@/lib/users';
import { makeUser } from '../helpers';

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

let me: User | null = null;
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ user: me }) }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

const manager = makeUser({ userId: 1, firstName: 'Mona', lastName: 'Manager', email: 'mona@ku.th', role: 'lab_manager' });
const ada = makeUser({ userId: 2, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ku.th', studentId: '6710545725', department: 'SKE' });
const bob = makeUser({ userId: 3, firstName: 'Bob', lastName: 'Builder', email: 'bob@ku.th', role: 'ta', active: false });

const list = (users: User[], extra: Partial<UserListResponse> = {}): UserListResponse => ({
  users,
  total: users.length,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  ...extra,
});

const lastUrl = () => new URLSearchParams(String(apiFetch.mock.calls.at(-1)?.[0]).split('?')[1]);
const ui = () => userEvent.setup();

beforeEach(() => {
  apiFetch.mockReset();
  me = manager;
  apiFetch.mockResolvedValue(list([manager, ada, bob]));
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('access', () => {
  test('renders nothing while the current user is loading', () => {
    me = null;
    const { container } = render(<UsersPage />);
    expect(container).toBeEmptyDOMElement();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test.each(['member', 'ta', 'lecturer'] as const)('a %s is told they have no access, and nothing is fetched', (role) => {
    me = makeUser({ role });
    render(<UsersPage />);
    expect(screen.getByRole('heading', { name: "You don't have access to this page" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to personal info' })).toHaveAttribute('href', '/profile');
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

describe('listing', () => {
  test('shows a loading message, then the people', async () => {
    render(<UsersPage />);
    expect(screen.getByText('Loading users…')).toBeInTheDocument();
    expect((await screen.findAllByText('Ada Lovelace')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Loading users…')).not.toBeInTheDocument();
  });

  test('first request: newest first, any status, page 1 of 20', async () => {
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(lastUrl())).toEqual({ sort: 'createdAt', order: 'desc', status: 'all', page: '1', pageSize: '20' });
  });

  test('marks the logged-in manager as "(you)", with no role select or status button for them', async () => {
    render(<UsersPage />);
    await screen.findAllByText('Mona Manager');
    expect(screen.getAllByText('(you)').length).toBeGreaterThan(0);
    const roleSelect = screen.getAllByLabelText('Role for Mona Manager')[0];
    expect(roleSelect).toBeDisabled();
    expect(roleSelect).toHaveAttribute('title', "You can't change your own role");
    expect(screen.getAllByRole('button', { name: /Deactivate|Reactivate/ })).toHaveLength(4); // 2 other people × 2 layouts
  });

  test('shows student ID and department under the email, and links to the person', async () => {
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    expect(screen.getAllByText('6710545725, SKE').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Ada Lovelace/ })[0]).toHaveAttribute('href', '/users/2');
  });

  test('a deactivated account offers "Reactivate"', async () => {
    render(<UsersPage />);
    await screen.findAllByText('Bob Builder');
    expect(screen.getAllByRole('button', { name: 'Reactivate' }).length).toBeGreaterThan(0);
  });

  test('range text and empty result', async () => {
    apiFetch.mockResolvedValue(list([ada], { total: 41, page: 1, totalPages: 3 }));
    const { unmount } = render(<UsersPage />);
    expect(await screen.findByText('1–20 of 41')).toBeInTheDocument();
    unmount();
    apiFetch.mockResolvedValue(list([], { total: 0 }));
    render(<UsersPage />);
    expect(await screen.findByText(/No users match your search/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });

  test('a failed request shows the message', async () => {
    apiFetch.mockRejectedValue(new Error('Database is down'));
    render(<UsersPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down');
  });
});

describe('search and filters', () => {
  test('search is sent after a short pause, trimmed', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    await user.type(screen.getByRole('searchbox'), '  ada  ');
    expect(apiFetch).toHaveBeenCalledTimes(1); // still waiting, nothing sent per keystroke
    await waitFor(() => expect(lastUrl().get('q')).toBe('ada'));
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  test('role and status filters are sent and go back to page 1', async () => {
    const user = ui();
    apiFetch.mockResolvedValue(list([ada], { total: 60, totalPages: 3 }));
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    await user.click(screen.getByLabelText('Next page'));
    await waitFor(() => expect(lastUrl().get('page')).toBe('2'));

    await user.selectOptions(screen.getByLabelText('Filter by role'), 'ta');
    await waitFor(() => expect(lastUrl().get('role')).toBe('ta'));
    expect(lastUrl().get('page')).toBe('1');

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'inactive');
    await waitFor(() => expect(lastUrl().get('status')).toBe('inactive'));
  });

  test('"All roles" removes the role filter again', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    await user.selectOptions(screen.getByLabelText('Filter by role'), 'lecturer');
    await waitFor(() => expect(lastUrl().get('role')).toBe('lecturer'));
    await user.selectOptions(screen.getByLabelText('Filter by role'), 'All roles');
    await waitFor(() => expect(lastUrl().has('role')).toBe(false));
  });
});

describe('sorting and paging', () => {
  test('clicking a column sorts by it (text ascending, dates descending), clicking again flips', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /^Name/ }));
    await waitFor(() => expect(lastUrl().get('sort')).toBe('name'));
    expect(lastUrl().get('order')).toBe('asc');
    await user.click(screen.getByRole('button', { name: /^Name/ }));
    await waitFor(() => expect(lastUrl().get('order')).toBe('desc'));
    await user.click(screen.getByRole('button', { name: /^Last sign-in/ }));
    await waitFor(() => expect(lastUrl().get('sort')).toBe('lastLoginAt'));
    expect(lastUrl().get('order')).toBe('desc');
  });

  test('the active column is announced with aria-sort', async () => {
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    expect(screen.getByRole('columnheader', { name: /Registered/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: /Name/ })).not.toHaveAttribute('aria-sort');
  });

  test('previous / next page buttons follow the page count', async () => {
    const user = ui();
    apiFetch.mockImplementation(async (url: string) => {
      const page = Number(new URLSearchParams(url.split('?')[1]).get('page'));
      return list([ada], { total: 45, page, totalPages: 3 });
    });
    render(<UsersPage />);
    await screen.findByText('1–20 of 45');
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    await user.click(screen.getByLabelText('Next page'));
    expect(await screen.findByText('21–40 of 45')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Next page'));
    expect(await screen.findByText('41–45 of 45')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeDisabled();
    await user.click(screen.getByLabelText('Previous page'));
    expect(await screen.findByText('21–40 of 45')).toBeInTheDocument();
  });
});

describe('changing a role', () => {
  test('asks first, then PATCHes, updates the row and shows a notice', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    apiFetch.mockResolvedValueOnce({ ...ada, role: 'lecturer' });
    await user.selectOptions(screen.getAllByLabelText('Role for Ada Lovelace')[0], 'lecturer');

    expect(window.confirm).toHaveBeenCalledWith('Change Ada Lovelace from Lab Member to Lecturer / Researcher?');
    expect(apiFetch).toHaveBeenLastCalledWith('/api/users/2/role', { method: 'PATCH', json: { role: 'lecturer' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Ada Lovelace is now Lecturer / Researcher');
    expect(screen.getAllByLabelText('Role for Ada Lovelace')[0]).toHaveValue('lecturer');
  });

  test('declining the confirmation changes nothing', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    const calls = apiFetch.mock.calls.length;
    await user.selectOptions(screen.getAllByLabelText('Role for Ada Lovelace')[0], 'lecturer');
    expect(apiFetch).toHaveBeenCalledTimes(calls);
    expect(screen.getAllByLabelText('Role for Ada Lovelace')[0]).toHaveValue('member');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('a server refusal is shown in the notice', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    apiFetch.mockRejectedValueOnce(new Error('At least one Lab Manager is required'));
    await user.selectOptions(screen.getAllByLabelText('Role for Ada Lovelace')[0], 'lab_manager');
    expect(await screen.findByRole('status')).toHaveTextContent('At least one Lab Manager is required');
  });
});

describe('deactivating and reactivating', () => {
  test('deactivate: confirms, PATCHes active=false, reports it', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    apiFetch.mockResolvedValueOnce({ ...ada, active: false });
    const row = screen.getAllByRole('row').find((r) => within(r).queryByText('Ada Lovelace')) as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Deactivate' }));

    expect(window.confirm).toHaveBeenCalledWith("Deactivate Ada Lovelace? They won't be able to sign in until you reactivate them.");
    expect(apiFetch).toHaveBeenLastCalledWith('/api/users/2/active', { method: 'PATCH', json: { active: false } });
    expect(await screen.findByRole('status')).toHaveTextContent('Ada Lovelace deactivated');
    expect(within(row).getByRole('button', { name: 'Reactivate' })).toBeInTheDocument();
  });

  test('reactivate: sends active=true', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Bob Builder');
    apiFetch.mockResolvedValueOnce({ ...bob, active: true });
    await user.click(screen.getAllByRole('button', { name: 'Reactivate' })[0]);
    expect(window.confirm).toHaveBeenCalledWith('Reactivate Bob Builder? They will be able to sign in again.');
    expect(apiFetch).toHaveBeenLastCalledWith('/api/users/3/active', { method: 'PATCH', json: { active: true } });
    expect(await screen.findByRole('status')).toHaveTextContent('Bob Builder reactivated');
  });

  test('declining the confirmation sends nothing', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    const calls = apiFetch.mock.calls.length;
    await user.click(screen.getAllByRole('button', { name: 'Deactivate' })[0]);
    expect(apiFetch).toHaveBeenCalledTimes(calls);
  });

  test('an error is shown in the notice', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    apiFetch.mockRejectedValueOnce(new Error('Not allowed'));
    await user.click(screen.getAllByRole('button', { name: 'Deactivate' })[0]);
    expect(await screen.findByRole('status')).toHaveTextContent('Not allowed');
  });

  test('the notice can be dismissed', async () => {
    const user = ui();
    render(<UsersPage />);
    await screen.findAllByText('Ada Lovelace');
    apiFetch.mockRejectedValueOnce(new Error('Not allowed'));
    await user.click(screen.getAllByRole('button', { name: 'Deactivate' })[0]);
    await screen.findByRole('status');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
