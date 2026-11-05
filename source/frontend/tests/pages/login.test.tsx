// The login page: redirect when already signed in, Google button, sign-in result and errors.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import LoginPage from '@/app/login/page';
import { ApiError } from '@/lib/api';

const router = { replace: vi.fn(), push: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

// next/font only works inside Next.js
vi.mock('@/lib/fonts', () => ({ fontVariables: '', fontStyle: {} }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

const loadGoogleScript = vi.fn();
const renderGoogleButton = vi.fn();
vi.mock('@/lib/googleSignIn', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/googleSignIn')>()),
  loadGoogleScript: () => loadGoogleScript(),
  renderGoogleButton: (...a: unknown[]) => renderGoogleButton(...a),
}));

const google = { accounts: { id: {} } };

beforeEach(() => {
  router.replace.mockReset();
  router.push.mockReset();
  apiFetch.mockReset();
  apiFetch.mockRejectedValue(new ApiError(401, 'No token')); // not signed in
  loadGoogleScript.mockReset();
  loadGoogleScript.mockResolvedValue(google);
  renderGoogleButton.mockReset();
});

const signInWith = () => renderGoogleButton.mock.calls.at(-1)?.[2].onCredential as (token: string) => void;

describe('layout', () => {
  test('welcome text, brand, theme switch and a way back home', async () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome to Vase Lab' })).toBeInTheDocument();
    expect(screen.getByText('Vase Lab', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
  });

  test('explains that the first sign-in creates the account', async () => {
    render(<LoginPage />);
    expect(screen.getByText(/Signing in creates your account/)).toBeInTheDocument();
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
  });
});

describe('already signed in', () => {
  test('goes straight to the dashboard', async () => {
    apiFetch.mockResolvedValue({});
    render(<LoginPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'));
    expect(apiFetch).toHaveBeenCalledWith('/auth/me');
  });

  test('a visitor who is not signed in stays on the page', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('Google button', () => {
  test('is drawn in the light style on a light page', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    const [passedGoogle, element, options] = renderGoogleButton.mock.calls[0];
    expect(passedGoogle).toBe(google);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(options.dark).toBe(false);
    expect(options.width).toBeGreaterThanOrEqual(200);
  });

  test('is drawn again in the dark style when the theme is switched', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('switch'));
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalledTimes(2));
    expect(renderGoogleButton.mock.calls[1][2].dark).toBe(true);
  });

  test('if Google cannot be loaded, the person is told what to do', async () => {
    loadGoogleScript.mockRejectedValue(new Error('offline'));
    render(<LoginPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Google sign-in could not be loaded');
    expect(renderGoogleButton).not.toHaveBeenCalled();
  });
});

describe('signing in', () => {
  test('sends the Google token to the backend, then opens the dashboard', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    apiFetch.mockResolvedValueOnce({});
    signInWith()('ID-TOKEN');
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/dashboard'));
    expect(apiFetch).toHaveBeenLastCalledWith('/auth/google', { method: 'POST', json: { idToken: 'ID-TOKEN' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('a refusal from the backend is shown and the person stays here', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    apiFetch.mockRejectedValueOnce(new ApiError(403, 'Account disabled'));
    signInWith()('ID-TOKEN');
    expect(await screen.findByRole('alert')).toHaveTextContent('Account disabled');
    expect(router.push).not.toHaveBeenCalled();
  });

  test('an unreachable server is reported', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    apiFetch.mockRejectedValueOnce(new ApiError(0, 'Could not reach the server'));
    signInWith()('ID-TOKEN');
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
  });

  test('the error disappears when the person tries again', async () => {
    render(<LoginPage />);
    await waitFor(() => expect(renderGoogleButton).toHaveBeenCalled());
    apiFetch.mockRejectedValueOnce(new ApiError(401, 'Invalid Google token'));
    signInWith()('bad');
    await screen.findByRole('alert');
    apiFetch.mockResolvedValueOnce({});
    signInWith()('good');
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
