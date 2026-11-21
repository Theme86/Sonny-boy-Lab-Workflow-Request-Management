// The landing page: sign-in state decides where the buttons go, the overview is always there,
// the theme switch is the same as on the login page, and the WebGL fluid follows the theme.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Home from '@/app/page';
import { ApiError } from '@/lib/api';
import type { FluidOptions } from '@/lib/fluidSimulation';

// next/font only works inside Next.js
vi.mock('@/lib/fonts', () => ({ fontVariables: '', fontStyle: {} }));

// jsdom has no WebGL
const stopFluid = vi.fn();
const fluidSimulation = vi.fn((canvas: HTMLCanvasElement, options?: FluidOptions) => {
  void canvas;
  void options;
  return stopFluid;
});
vi.mock('@/lib/fluidSimulation', () => ({
  fluidSimulation: (c: HTMLCanvasElement, o?: FluidOptions) => fluidSimulation(c, o),
}));

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

const header = () => screen.getByRole('banner');

describe('Landing page', () => {
  test('visitors who are not signed in are sent to the login page', async () => {
    apiFetch.mockRejectedValue(new ApiError(401, 'No token'));
    render(<Home />);

    const links = await screen.findAllByRole('link', { name: /^Sign in/ });
    expect(links.map((l) => l.textContent)).toEqual(['Sign in', 'Sign in with Google']);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/login'));
    expect(screen.getByText('First time here? Signing in creates your account.')).toBeInTheDocument();
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

  test('has the same header as the login page, with the light/dark switch', async () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    render(<Home />);

    expect(within(header()).getByRole('link', { name: 'Vase Lab' })).toHaveAttribute('href', '/');
    const toggle = within(header()).getByRole('switch', { name: 'Dark mode' });
    expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(toggle);
    expect(document.documentElement).toHaveClass('dark');
  });

  test('the Vase Lab heading reads normally even though its letters animate one by one', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1, name: 'Vase Lab' })).toBeInTheDocument();
    expect(screen.getByText('Requests, bookings and stock')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'What you can do here' })).toHaveAttribute('href', '#what-you-can-do');
  });

  test('explains each page of the app, the request statuses and the roles', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    const { container } = render(<Home />);

    expect(container.querySelector('#what-you-can-do')).not.toBeNull();
    for (const page of ['Home', 'Requests', 'Lab sessions', 'Consumables', 'Equipment', 'Rooms']) {
      expect(screen.getByRole('heading', { level: 3, name: page })).toBeInTheDocument();
    }
    const opens = screen.getAllByRole('link', { name: 'Open' }).map((a) => a.getAttribute('href'));
    expect(opens).toEqual(['/dashboard', '/requests', '/labsessions', '/consumables', '/equipment', '/rooms']);

    expect(screen.getByRole('heading', { name: 'Request statuses' })).toBeInTheDocument();
    for (const status of ['Open', 'In review', 'Approved', 'In progress', 'Blocked', 'Completed', 'Rejected', 'Closed']) {
      expect(screen.getByText(status, { selector: 'span' })).toBeInTheDocument();
    }

    const roles = screen.getByRole('table');
    for (const role of ['Lab Member', 'Teaching Assistant', 'Lecturer / Researcher', 'Lab Manager']) {
      expect(within(roles).getByText(role)).toBeInTheDocument();
    }
  });

  test('starts the fluid once, tinted to the current theme, and stops it on leaving', async () => {
    apiFetch.mockReturnValue(new Promise(() => {}));
    const { container, unmount } = render(<Home />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(fluidSimulation).toHaveBeenCalledTimes(1);
    const [usedCanvas, options] = fluidSimulation.mock.calls[0];
    expect(usedCanvas).toBe(canvas);
    const lightBack = options?.backColor?.();

    // switching the theme changes the fluid's colours without restarting it
    await userEvent.click(screen.getByRole('switch', { name: 'Dark mode' }));
    await waitFor(() => expect(options?.backColor?.()).not.toEqual(lightBack));
    expect(fluidSimulation).toHaveBeenCalledTimes(1);

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
