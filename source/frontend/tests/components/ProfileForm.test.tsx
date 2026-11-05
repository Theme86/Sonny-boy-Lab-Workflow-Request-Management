// Behaviour tests for the create-profile (setup) and edit-profile forms.
// These pin down what the form does today so it can be split into smaller pieces safely.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ProfileForm } from '@/components/ProfileForm';
import { ApiError } from '@/lib/api';
import type { User } from '@/lib/users';
import { makeFile, makeUser } from '../helpers';

const router = { replace: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const setUser = vi.fn();
let currentUser: User | null = null;
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: currentUser, setUser, loading: false, error: '', reload: vi.fn() }),
}));

// keep the real imageUrl/ApiError, replace only the network call
const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), apiFetch: (...a: unknown[]) => apiFetch(...a) }));

const newcomer = () => makeUser({ firstName: '', lastName: '', profileCompletedAt: null, studentId: null, phone: null });
const existing = () => makeUser({ firstName: 'Ada', lastName: 'Lovelace', studentId: '6710545725', phone: '0812345678', department: 'SKE', bio: 'Hi' });

const ui = () => userEvent.setup({ applyAccept: false }); // we test our own file-type check, not the browser's

const field = (label: string | RegExp) => screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;
const avatarInput = (container: HTMLElement) => container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement;
const bannerInput = (container: HTMLElement) => container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;

beforeEach(() => {
  router.replace.mockReset();
  setUser.mockReset();
  apiFetch.mockReset();
  currentUser = existing();
});

test('renders nothing until the current user has loaded', () => {
  currentUser = null;
  const { container } = render(<ProfileForm mode="setup" />);
  expect(container).toBeEmptyDOMElement();
});

// =====================================================================================
describe('create profile (setup)', () => {
  beforeEach(() => {
    currentUser = newcomer();
  });

  test('welcomes the person and shows their email and role', () => {
    render(<ProfileForm mode="setup" />);
    expect(screen.getByRole('heading', { name: 'Create your profile' })).toBeInTheDocument();
    expect(screen.getByText(/ada@ku\.th \(Lab Member\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create profile' })).toBeEnabled();
  });

  test('the names are required: nothing is sent and both errors are shown', async () => {
    render(<ProfileForm mode="setup" />);
    await ui().click(screen.getByRole('button', { name: 'Create profile' }));
    expect(screen.getByText('First name is required.')).toBeInTheDocument();
    expect(screen.getByText('Last name is required.')).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('marks the invalid fields for screen readers', async () => {
    render(<ProfileForm mode="setup" />);
    await ui().click(screen.getByRole('button', { name: 'Create profile' }));
    expect(field(/First name/)).toHaveAttribute('aria-invalid', 'true');
    expect(field(/Phone number/)).toHaveAttribute('aria-invalid', 'false');
  });

  test('typing in a field clears its own error only', async () => {
    const user = ui();
    render(<ProfileForm mode="setup" />);
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    await user.type(field(/First name/), 'A');
    expect(screen.queryByText('First name is required.')).not.toBeInTheDocument();
    expect(screen.getByText('Last name is required.')).toBeInTheDocument();
  });

  test('saves the profile, marks it complete and goes to /profile', async () => {
    const saved = makeUser({ firstName: 'Ada', lastName: 'Lovelace' });
    apiFetch.mockResolvedValue(saved);
    const user = ui();
    render(<ProfileForm mode="setup" />);
    await user.type(field(/First name/), '  Ada ');
    await user.type(field(/Last name/), 'Lovelace');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/profile'));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/users/me', {
      method: 'PATCH',
      json: { firstName: 'Ada', lastName: 'Lovelace', markProfileComplete: true },
    });
    expect(setUser).toHaveBeenCalledWith(saved);
  });

  test('even with no changes the profile is still marked complete (name fields filled by Google)', async () => {
    currentUser = makeUser({ profileCompletedAt: null });
    apiFetch.mockResolvedValue(currentUser);
    render(<ProfileForm mode="setup" />);
    await ui().click(screen.getByRole('button', { name: 'Create profile' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/profile'));
    expect(apiFetch).toHaveBeenCalledWith('/api/users/me', { method: 'PATCH', json: { markProfileComplete: true } });
  });

  test('sends optional fields too, trimmed', async () => {
    apiFetch.mockResolvedValue(makeUser());
    const user = ui();
    render(<ProfileForm mode="setup" />);
    await user.type(field(/First name/), 'Ada');
    await user.type(field(/Last name/), 'Lovelace');
    await user.type(field(/Student/), '6710545725');
    await user.type(field(/Phone/), ' 081 234 5678 ');
    await user.type(field(/Faculty/), 'SKE');
    await user.type(field(/About/), 'Microscopes');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch.mock.calls[0][1].json).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      studentId: '6710545725',
      phone: '081 234 5678',
      department: 'SKE',
      bio: 'Microscopes',
      markProfileComplete: true,
    });
  });

  test('a server error is shown and the person stays on the form', async () => {
    apiFetch.mockRejectedValue(new ApiError(500, 'Database is down'));
    const user = ui();
    render(<ProfileForm mode="setup" />);
    await user.type(field(/First name/), 'Ada');
    await user.type(field(/Last name/), 'Lovelace');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Database is down');
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Create profile' })).toBeEnabled();
  });

  test('the button says "Creating…" and is disabled while saving', async () => {
    let finish: (u: User) => void = () => {};
    apiFetch.mockReturnValue(new Promise<User>((resolve) => (finish = resolve)));
    const user = ui();
    render(<ProfileForm mode="setup" />);
    await user.type(field(/First name/), 'Ada');
    await user.type(field(/Last name/), 'Lovelace');
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    expect(await screen.findByRole('button', { name: 'Creating…' })).toBeDisabled();
    finish(makeUser());
    await waitFor(() => expect(router.replace).toHaveBeenCalled());
  });

  test('a failed picture upload stops everything: the profile is not marked created', async () => {
    apiFetch.mockRejectedValueOnce(new ApiError(415, 'Only JPG, PNG or WEBP images are allowed'));
    const user = ui();
    const { container } = render(<ProfileForm mode="setup" />);
    await user.type(field(/First name/), 'Ada');
    await user.type(field(/Last name/), 'Lovelace');
    await user.upload(avatarInput(container), makeFile('me.png', 'image/png'));
    await user.click(screen.getByRole('button', { name: 'Create profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only JPG, PNG or WEBP');
    expect(apiFetch).toHaveBeenCalledTimes(1); // only the upload was tried, never the PATCH
    expect(router.replace).not.toHaveBeenCalled();
  });
});

// =====================================================================================
describe('form fields', () => {
  test('student ID accepts digits only: letters are dropped as you type', async () => {
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.clear(field(/Student/));
    await user.type(field(/Student/), '67a1-0b5');
    expect(field(/Student/)).toHaveValue('6710' + '5');
  });

  test('the fields stop at the maximum lengths', () => {
    render(<ProfileForm mode="edit" />);
    expect(field(/First name/)).toHaveAttribute('maxlength', '100');
    expect(field(/Last name/)).toHaveAttribute('maxlength', '100');
    expect(field(/Student/)).toHaveAttribute('maxlength', '20');
    expect(field(/Phone/)).toHaveAttribute('maxlength', '20');
    expect(field(/Faculty/)).toHaveAttribute('maxlength', '150');
    expect(field(/About/)).toHaveAttribute('maxlength', '300');
  });

  test('the bio counter follows what is typed', async () => {
    const user = ui();
    render(<ProfileForm mode="edit" />);
    expect(screen.getByText('2 / 300')).toBeInTheDocument(); // "Hi"
    await user.type(field(/About/), ' there');
    expect(screen.getByText('8 / 300')).toBeInTheDocument();
  });

  test('an invalid phone number is rejected with an example', async () => {
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.clear(field(/Phone/));
    await user.type(field(/Phone/), 'call me');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText(/Use digits, spaces or "-"/)).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});

// =====================================================================================
describe('edit profile', () => {
  test('shows the saved values, with the email read-only', () => {
    render(<ProfileForm mode="edit" />);
    expect(screen.getByRole('heading', { name: 'Edit profile' })).toBeInTheDocument();
    expect(field(/First name/)).toHaveValue('Ada');
    expect(field(/Student/)).toHaveValue('6710545725');
    expect(field(/Phone/)).toHaveValue('0812345678');
    expect(field(/About/)).toHaveValue('Hi');
    const email = screen.getByDisplayValue('ada@ku.th');
    expect(email).toBeDisabled();
  });

  test('"Save changes" stays disabled until something changes', async () => {
    const user = ui();
    render(<ProfileForm mode="edit" />);
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();
    await user.type(field(/First name/), 'x');
    expect(save).toBeEnabled();
    await user.keyboard('{Backspace}');
    expect(save).toBeDisabled(); // back to the saved value
  });

  test('changing only whitespace is not a change', async () => {
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.type(field(/First name/), '   ');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('sends only the fields that changed, trimmed, and does not mark the profile complete', async () => {
    apiFetch.mockResolvedValue(makeUser({ firstName: 'Augusta' }));
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.clear(field(/First name/));
    await user.type(field(/First name/), ' Augusta ');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/users/me', { method: 'PATCH', json: { firstName: 'Augusta' } });
  });

  test('clearing an optional field sends an empty string so the server clears it', async () => {
    apiFetch.mockResolvedValue(makeUser());
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.clear(field(/Phone/));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch.mock.calls[0][1].json).toEqual({ phone: '' });
  });

  test('after saving: confirmation, shared user updated, no redirect', async () => {
    const saved = makeUser({ firstName: 'Augusta', studentId: '6710545725', phone: '0812345678', department: 'SKE', bio: 'Hi' });
    apiFetch.mockResolvedValue(saved);
    const user = ui();
    const { rerender } = render(<ProfileForm mode="edit" />);
    await user.clear(field(/First name/));
    await user.type(field(/First name/), 'Augusta');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(setUser).toHaveBeenCalled());
    currentUser = saved; // the real provider would now hand the saved user back
    rerender(<ProfileForm mode="edit" />);

    expect(await screen.findByRole('status')).toHaveTextContent('Changes saved');
    expect(setUser).toHaveBeenCalledWith(saved);
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Done' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('editing again hides "Changes saved"', async () => {
    apiFetch.mockResolvedValue({ ...existing(), firstName: 'Adax' });
    const user = ui();
    const { rerender } = render(<ProfileForm mode="edit" />);
    await user.type(field(/First name/), 'x');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(setUser).toHaveBeenCalled());
    currentUser = { ...existing(), firstName: 'Adax' };
    rerender(<ProfileForm mode="edit" />);
    await screen.findByRole('status');
    await user.type(field(/First name/), 'y');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('a server error is shown, and the edits are kept', async () => {
    apiFetch.mockRejectedValue(new ApiError(400, 'Phone number can only contain digits'));
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.type(field(/First name/), 'x');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Phone number can only contain digits');
    expect(field(/First name/)).toHaveValue('Adax');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('"Cancel" and the back arrow go to /profile', () => {
    render(<ProfileForm mode="edit" />);
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Back to personal info' })).toHaveAttribute('href', '/profile');
  });
});

// =====================================================================================
describe('profile picture', () => {
  test('the picture button says Add or Change depending on whether there is one', () => {
    currentUser = makeUser({ avatarUrl: null });
    const { unmount } = render(<ProfileForm mode="edit" />);
    expect(screen.getByRole('button', { name: 'Add profile picture' })).toBeInTheDocument();
    unmount();
    currentUser = makeUser({ avatarUrl: '/userImages/1/avatar.png' });
    render(<ProfileForm mode="edit" />);
    expect(screen.getByRole('button', { name: 'Change profile picture' })).toBeInTheDocument();
  });

  test('a valid picture enables saving and uploads before the profile is patched', async () => {
    const calls: string[] = [];
    apiFetch.mockImplementation(async (path: string, init: { method: string }) => {
      calls.push(`${init.method} ${path}`);
      return makeUser({ avatarUrl: '/userImages/1/avatar.png' });
    });
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    const file = makeFile('me.png', 'image/png');
    await user.upload(avatarInput(container), file);

    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeEnabled();
    await user.type(field(/First name/), 'x');
    await user.click(save);
    await waitFor(() => expect(calls).toHaveLength(2));

    expect(calls).toEqual(['PUT /api/users/me/avatar', 'PATCH /api/users/me']);
    const [, upload] = apiFetch.mock.calls[0];
    expect(upload.body).toBe(file);
    expect(upload.headers).toEqual({ 'Content-Type': 'image/png' });
  });

  test('uploading only a picture does not send a profile PATCH', async () => {
    apiFetch.mockResolvedValue(makeUser({ avatarUrl: '/userImages/1/avatar.png' }));
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('me.jpg', 'image/jpeg'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][0]).toBe('/api/users/me/avatar');
  });

  test('a file that is not JPG, PNG or WEBP is refused', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('doc.pdf', 'application/pdf'));
    expect(screen.getByText('Choose a JPG, PNG or WEBP image.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('a picture over 2 MB is refused', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('big.png', 'image/png', 2 * 1024 * 1024 + 1));
    expect(screen.getByText('Choose an image of 2 MB or less.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  test('exactly 2 MB is fine', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('ok.png', 'image/png', 2 * 1024 * 1024));
    expect(screen.queryByText(/2 MB or less/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  test('"Keep current picture" drops the chosen file', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('me.png', 'image/png'));
    await user.click(screen.getByRole('button', { name: 'Keep current picture' }));
    expect(screen.queryByRole('button', { name: 'Keep current picture' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });
});

// =====================================================================================
describe('banner', () => {
  test('a valid banner is uploaded on save', async () => {
    apiFetch.mockResolvedValue(makeUser({ bannerUrl: '/userImages/1/banner.png' }));
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(bannerInput(container), makeFile('wide.webp', 'image/webp'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch.mock.calls[0][0]).toBe('/api/users/me/banner');
    expect(apiFetch.mock.calls[0][1].method).toBe('PUT');
    expect(apiFetch.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'image/webp' });
  });

  test('a banner over 5 MB is refused, 5 MB is fine', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(bannerInput(container), makeFile('big.png', 'image/png', 5 * 1024 * 1024 + 1));
    expect(screen.getByText('Choose an image of 5 MB or less.')).toBeInTheDocument();
    await user.upload(bannerInput(container), makeFile('ok.png', 'image/png', 5 * 1024 * 1024));
    expect(screen.queryByText(/5 MB or less/)).not.toBeInTheDocument();
  });

  test('"Use default banner" is applied on save with a DELETE and no other request', async () => {
    apiFetch.mockResolvedValue(makeUser());
    const user = ui();
    render(<ProfileForm mode="edit" />);
    await user.click(screen.getByRole('button', { name: 'Use default banner' }));
    expect(screen.getByText('The default banner will be used when you save.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use default banner' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch).toHaveBeenCalledWith('/api/users/me/banner', { method: 'DELETE' });
  });

  test('choosing a new banner cancels "use default"', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.click(screen.getByRole('button', { name: 'Use default banner' }));
    await user.upload(bannerInput(container), makeFile('wide.png', 'image/png'));
    expect(screen.queryByText('The default banner will be used when you save.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep current banner' })).toBeInTheDocument();
  });

  test('"Keep current banner" drops the chosen file', async () => {
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(bannerInput(container), makeFile('wide.png', 'image/png'));
    await user.click(screen.getByRole('button', { name: 'Keep current banner' }));
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Use default banner' })).toBeInTheDocument();
  });

  test('avatar, banner and profile fields are saved in that order', async () => {
    const calls: string[] = [];
    apiFetch.mockImplementation(async (path: string, init: { method: string }) => {
      calls.push(`${init.method} ${path}`);
      return makeUser();
    });
    const user = ui();
    const { container } = render(<ProfileForm mode="edit" />);
    await user.upload(avatarInput(container), makeFile('a.png', 'image/png'));
    await user.upload(bannerInput(container), makeFile('b.png', 'image/png'));
    await user.type(field(/First name/), 'x');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(calls).toHaveLength(3));
    expect(calls).toEqual(['PUT /api/users/me/avatar', 'PUT /api/users/me/banner', 'PATCH /api/users/me']);
  });

  test('the banner preview shows the saved banner', () => {
    currentUser = makeUser({ bannerUrl: '/userImages/1/banner.png' });
    render(<ProfileForm mode="edit" />);
    expect(screen.getByRole('img', { name: 'Banner preview' }).getAttribute('style')).toContain('/userImages/1/banner.png');
  });
});
