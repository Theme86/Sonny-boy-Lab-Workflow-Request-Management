import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CurrentUserProvider, useCurrentUser } from '@/hooks/useCurrentUser';
import { jsonResponse, makeUser } from '../helpers';

// the router object must stay the same between renders, otherwise the effect would run again and again
const router = { replace: vi.fn() };
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const fetchMock = vi.fn();
beforeEach(() => {
  router.replace.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

const wrapper = ({ children }: { children: ReactNode }) => <CurrentUserProvider>{children}</CurrentUserProvider>;
const mount = () => renderHook(() => useCurrentUser(), { wrapper });

describe('CurrentUserProvider', () => {
  test('starts in the loading state with no user', () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { result } = mount();
    expect(result.current).toMatchObject({ user: null, loading: true, error: '' });
  });

  test('loads the logged-in user from /api/users/me', async () => {
    const me = makeUser({ firstName: 'Grace' });
    fetchMock.mockResolvedValue(jsonResponse(me));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(me);
    expect(result.current.error).toBe('');
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/users\/me$/);
    expect(router.replace).not.toHaveBeenCalled();
  });

  test.each([401, 403])('a %i answer sends the visitor to the login page', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'nope' }, status));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(router.replace).toHaveBeenCalledWith('/login');
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('');
  });

  test('another server error is shown as a message, without leaving the page', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Database is down' }, 500));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Database is down');
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('an unreachable server is reported', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Could not reach the server');
  });

  test('reload() ("Try again") fetches again and clears the error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = mount();
    await waitFor(() => expect(result.current.error).not.toBe(''));

    fetchMock.mockResolvedValueOnce(jsonResponse(makeUser({ firstName: 'Back' })));
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.user?.firstName).toBe('Back');
    expect(result.current.error).toBe('');
  });

  test('reload() also redirects to login when the session has expired', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(makeUser()));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Invalid or expired token' }, 401));
    await act(async () => {
      await result.current.reload();
    });
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  test('setUser() updates the shared user, e.g. after saving the profile', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeUser()));
    const { result } = mount();
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setUser(makeUser({ firstName: 'Renamed' })));
    expect(result.current.user?.firstName).toBe('Renamed');
  });

  test('a response that arrives after unmounting is ignored', async () => {
    let finish: (r: Response) => void = () => {};
    fetchMock.mockReturnValue(new Promise<Response>((resolve) => (finish = resolve)));
    const { unmount } = mount();
    unmount();
    await act(async () => finish(jsonResponse({ error: 'late' }, 401)));
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe('useCurrentUser outside the provider', () => {
  test('throws a clear error instead of returning nothing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useCurrentUser())).toThrow(/CurrentUserProvider/);
  });
});
