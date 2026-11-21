// The landing page: sign-in state decides where the buttons go, the copy is always there,
// and the WebGL fluid starts once (and is stopped when the page goes away).
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Home from '@/app/page';
import { ApiError } from '@/lib/api';

// next/font only works inside Next.js
vi.mock('@/lib/fonts', () => ({ fontVariables: '', fontStyle: {}, landingFontVariable: '' }));

// jsdom has no WebGL
const stopFluid = vi.fn();
const fluidSimulation = vi.fn((canvas: HTMLCanvasElement) => {
  void canvas;
  return stopFluid;
});
vi.mock('@/lib/fluidSimulation', () => ({ fluidSimulation: (c: HTMLCanvasElement) => fluidSimulation(c) }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

beforeEach(() => {
  apiFetch.mockReset();
  fluidSimulation.mockClear();
  stopFluid.mockClear();
});

describe('Landing page', () => {
  test('visitors who are not signed in are sent to the login page', async () => {
    apiFetch.mockRejectedValue(new ApiError(401, 'No token'));
    render(<Home />);

    const links = await screen.findAllByRole('link', { name: /^Sign in/ });
    expect(links).toHaveLength(2); // top bar and the bar under the heading
    links.forEach((link) => expect(link).toHaveAttribute('href', '/login'));
    expect(screen.queryByRole('link', { name: 'Go to dashboard' })).not.toBeInTheDocument();
  });

  test('signed-in users are sent to the dashboard', async () => {
    apiFetch.mockResolvedValue({ id: 1 });
    render(<Home />);

    const links = await screen.findAllByRole('link', { name: 'Go to dashboard' });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/dashboard'));
    expect(screen.queryByRole('link', { name: /^Sign in/ })).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledWith('/auth/me');
  });

  test('shows no sign-in button until the server has answered', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    render(<Home />);

    expect(screen.getByText('Checking access…')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Sign in/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to dashboard' })).not.toBeInTheDocument();
  });

  test('the heading and links read normally even though the words animate one by one', async () => {
    apiFetch.mockRejectedValue(new ApiError(401, 'No token'));
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Every Lab Request, Tracked to Done');
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Equipment' })).toHaveAttribute('href', '/equipment');
    expect(screen.getByRole('link', { name: 'Vase Lab' })).toHaveAttribute('href', '/');
    await waitFor(() => expect(screen.queryByText('Checking access…')).not.toBeInTheDocument());
  });

  test('under the hero, explains what each part of the app does and links to it', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    render(<Home />);

    expect(screen.getByRole('link', { name: /See what’s inside/ })).toHaveAttribute('href', '#features');
    expect(screen.getByRole('heading', { level: 2, name: 'Everything the lab runs on' })).toBeInTheDocument();
    const parts = ['Requests', 'Lab sessions', 'Rooms', 'Equipment', 'Consumables', 'Dashboard & notifications'];
    parts.forEach((part) => expect(screen.getByRole('heading', { level: 3, name: part })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Open consumables/ })).toHaveAttribute('href', '/consumables');
    expect(screen.getByRole('heading', { level: 2, name: 'Four roles, one lab' })).toBeInTheDocument();
    expect(screen.getByText('Lab manager')).toBeInTheDocument();
  });

  test('starts the fluid on the background canvas and stops it on leaving', async () => {
    apiFetch.mockRejectedValue(new ApiError(401, 'No token'));
    const { container, unmount } = render(<Home />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(fluidSimulation).toHaveBeenCalledTimes(1);
    expect(fluidSimulation).toHaveBeenCalledWith(canvas);

    unmount();
    expect(stopFluid).toHaveBeenCalledTimes(1);
  });

  test('without WebGL the page still renders', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    fluidSimulation.mockImplementationOnce(() => {
      throw new Error('WebGL is not available');
    });
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('people who ask for reduced motion get no moving fluid', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    render(<Home />);

    expect(fluidSimulation).not.toHaveBeenCalled();
  });
});
