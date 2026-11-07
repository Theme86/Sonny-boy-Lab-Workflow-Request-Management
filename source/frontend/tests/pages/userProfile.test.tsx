// Viewing another person's profile (/users/[id]) and my own (/profile).
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import UserProfilePage from '@/app/users/[id]/page';
import ProfilePage from '@/app/profile/page';
import type { User } from '@/lib/users';
import { makeUser } from '../helpers';

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

let me: User | null = null;
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ user: me }) }));

let params = { id: '2' };
vi.mock('next/navigation', () => ({ useParams: () => params }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

const ada = makeUser({ userId: 2, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@ku.th' });

beforeEach(() => {
  apiFetch.mockReset();
  params = { id: '2' };
  me = makeUser({ userId: 1, firstName: 'Mona', lastName: 'Manager', email: 'mona@ku.th', role: 'lab_manager' });
});

describe('/users/[id]', () => {
  test('loads the profile for the id in the address', async () => {
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    expect(screen.getByText('Loading profile…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/api/users/2');
  });

  test('the id is URL-encoded', async () => {
    params = { id: 'a/b' };
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    expect(apiFetch).toHaveBeenCalledWith('/api/users/a%2Fb');
  });

  test('the Lab Manager goes back to the user list', async () => {
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
  });

  test('anyone else goes back to their own personal info', async () => {
    me = makeUser({ userId: 5, role: 'member' });
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    expect(screen.getByRole('link', { name: 'Personal info' })).toHaveAttribute('href', '/profile');
  });

  test('someone else\'s profile has no Edit button and no "Add…" prompts', async () => {
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    expect(screen.queryByRole('link', { name: 'Edit profile' })).not.toBeInTheDocument();
    expect(screen.queryByText('Add a short bio')).not.toBeInTheDocument();
    expect(screen.getAllByText('Not provided').length).toBeGreaterThan(0);
  });

  test('my own profile seen here can be edited', async () => {
    me = ada;
    apiFetch.mockResolvedValue(ada);
    render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile/edit');
  });

  test('an error says the profile is not available, with a way back', async () => {
    apiFetch.mockRejectedValue(new Error('User not found'));
    render(<UserProfilePage />);
    expect(await screen.findByRole('heading', { name: "This profile isn't available" })).toBeInTheDocument();
    expect(screen.getByText('User not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toBeInTheDocument();
  });

  test('moving to another id loads that person', async () => {
    apiFetch.mockResolvedValueOnce(ada);
    const { rerender } = render(<UserProfilePage />);
    await screen.findByRole('heading', { name: 'Ada Lovelace' });
    params = { id: '3' };
    apiFetch.mockResolvedValueOnce(makeUser({ userId: 3, firstName: 'Bob', lastName: 'Builder' }));
    rerender(<UserProfilePage />);
    expect(await screen.findByRole('heading', { name: 'Bob Builder' })).toBeInTheDocument();
    await waitFor(() => expect(apiFetch).toHaveBeenLastCalledWith('/api/users/3'));
  });
});

describe('/profile', () => {
  test('renders nothing until the user is known', () => {
    me = null;
    const { container } = render(<ProfilePage />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows my details, an Edit link and the Google-email note', () => {
    me = makeUser({ firstName: 'Ada', lastName: 'Lovelace' });
    render(<ProfilePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Personal info' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile/edit');
    expect(screen.getByText(/can only be changed in your Google account/)).toBeInTheDocument();
    expect(screen.getByText('Add a short bio')).toBeInTheDocument(); // editable
  });
});
