// The request detail page (/requests/[id]): lab staff move a request along and assign it; members only read it.
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import RequestDetailPage from '@/app/requests/[id]/page';
import { ApiError } from '@/lib/api';
import type { RequestDetail, RequestDetailResponse } from '@/lib/requests';
import { jsonResponse } from '../helpers';

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('next/navigation', () => ({ useParams: () => ({ id: '7' }) }));

let me = { userId: 1, role: 'lab_manager' };
vi.mock('@/hooks/useRequireAuth', () => ({ useRequireAuth: () => ({ user: me, loading: false, error: '' }) }));

const apiFetch = vi.fn();
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch: (...a: unknown[]) => apiFetch(...a),
}));

const person = (userId: number, firstName: string, lastName: string) => ({
  userId,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}@ku.th`,
});
const ada = person(5, 'Ada', 'Lovelace');
const mona = person(1, 'Mona', 'Manager');
const tara = person(2, 'Tara', 'Tan');

const openRequest: RequestDetail = {
  requestId: 7,
  requesterId: 5,
  assignedTo: null,
  type: 'ticket',
  title: 'Fix backup script',
  description: 'The nightly backup fails',
  status: 'open',
  priority: 'medium',
  equipmentId: null,
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: null,
  closedAt: null,
  requester: ada,
  assignee: null,
  equipment: null,
  industryDetail: null,
  accessDetail: null,
  consumableOrderItems: [],
  statusHistory: [
    { historyId: 1, oldStatus: null, newStatus: 'open', changedAt: '2026-11-10T08:00:00.000Z', changer: ada },
  ],
};

const restrictedDetail = {
  partnerCompany: 'ACME Co',
  contactName: 'Mr Smith',
  contactEmail: 'smith@acme.com',
  contactPhone: null,
  confidentiality: 'restricted',
};

const people = [
  { userId: 1, firstName: 'Mona', lastName: 'Manager', role: 'lab_manager' },
  { userId: 2, firstName: 'Tara', lastName: 'Tan', role: 'ta' },
];

// What GET /api/requests/7 answers with (allowedStatuses is what the backend says this person may pick now).
let loaded: RequestDetailResponse;

beforeEach(() => {
  apiFetch.mockReset();
  me = { userId: 1, role: 'lab_manager' };
  loaded = { request: openRequest, allowedStatuses: ['in_review', 'in_progress', 'rejected'] };
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(loaded)));
  apiFetch.mockImplementation(async (path: string) => {
    if (path === '/api/requests/assignees') return { assignees: people };
    throw new Error(`Unexpected call: ${path}`);
  });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('staff: changing the status', () => {
  test('a lab manager gets one button for each status the backend allows', async () => {
    render(<RequestDetailPage />);
    expect(await screen.findByRole('heading', { name: 'Manage request' })).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Change status' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Move to In review',
      'Move to In progress',
      'Move to Rejected',
    ]);
  });

  test('a TA and a lecturer get them too', async () => {
    for (const role of ['ta', 'lecturer']) {
      me = { userId: 3, role };
      const { unmount } = render(<RequestDetailPage />);
      expect(await screen.findByRole('heading', { name: 'Manage request' })).toBeInTheDocument();
      unmount();
    }
  });

  test('clicking a status sends it, then shows the new status, history and buttons', async () => {
    const user = userEvent.setup();
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });

    apiFetch.mockResolvedValueOnce({
      request: {
        ...openRequest,
        status: 'in_review',
        statusHistory: [
          ...openRequest.statusHistory,
          { historyId: 2, oldStatus: 'open', newStatus: 'in_review', changedAt: '2026-11-11T09:00:00.000Z', changer: mona },
        ],
      },
      allowedStatuses: ['approved', 'in_progress', 'blocked', 'rejected'],
    });
    await user.click(screen.getByRole('button', { name: 'Move to In review' }));

    expect(apiFetch).toHaveBeenLastCalledWith('/api/requests/7/status', { method: 'PATCH', json: { status: 'in_review' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Status changed to In review.');
    expect(screen.getByRole('button', { name: 'Move to Approved' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move to In review' })).not.toBeInTheDocument();
    expect(screen.getByText('Open → In review')).toBeInTheDocument(); // new row in the status history
  });

  test('closing asks first, and declining sends nothing', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    loaded = { request: { ...openRequest, status: 'completed' }, allowedStatuses: ['closed', 'in_progress'] };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });

    const calls = apiFetch.mock.calls.length;
    await user.click(screen.getByRole('button', { name: 'Close request' }));
    expect(window.confirm).toHaveBeenCalledWith('Close this request? A closed request cannot be reopened or reassigned.');
    expect(apiFetch).toHaveBeenCalledTimes(calls);
  });

  test('closing, once confirmed, sends "closed" and leaves nothing more to change', async () => {
    const user = userEvent.setup();
    loaded = { request: { ...openRequest, status: 'completed' }, allowedStatuses: ['closed', 'in_progress'] };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });

    apiFetch.mockResolvedValueOnce({
      request: { ...openRequest, status: 'closed', closedAt: '2026-11-12T10:00:00.000Z' },
      allowedStatuses: [],
    });
    await user.click(screen.getByRole('button', { name: 'Close request' }));

    expect(apiFetch).toHaveBeenLastCalledWith('/api/requests/7/status', { method: 'PATCH', json: { status: 'closed' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Status changed to Closed.');
    expect(screen.getByText('This request is closed, so its status can’t be changed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close request' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Assigned to')).toBeDisabled();
    expect(screen.getByText('A closed request cannot be reassigned.')).toBeInTheDocument();
  });

  test('a refusal from the server is shown, and the buttons come back', async () => {
    const user = userEvent.setup();
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });

    apiFetch.mockRejectedValueOnce(new ApiError(403, 'Only lab staff can change the status of a request'));
    await user.click(screen.getByRole('button', { name: 'Move to Rejected' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Only lab staff can change the status of a request');
    expect(screen.getByRole('button', { name: 'Move to In review' })).toBeEnabled();
  });

  test('when someone else changed the request first, it is loaded again and the person is told', async () => {
    const user = userEvent.setup();
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    expect(fetch).toHaveBeenCalledTimes(1);

    apiFetch.mockRejectedValueOnce(new ApiError(409, 'Someone else just changed this request. Reload the page and try again.'));
    loaded = { request: { ...openRequest, status: 'in_review' }, allowedStatuses: ['approved'] };
    await user.click(screen.getByRole('button', { name: 'Move to In progress' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Someone else changed this request just now, so it was reloaded. Check it and try again.',
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('button', { name: 'Move to Approved' })).toBeInTheDocument();
  });
});

describe('staff: assigning', () => {
  test('nothing can be saved until the list has loaded and a different person is picked', async () => {
    const user = userEvent.setup();
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    const select = screen.getByLabelText('Assigned to');
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getByRole('button', { name: 'Save assignee' })).toBeDisabled();

    await user.selectOptions(select, 'Tara Tan (TA)');
    expect(screen.getByRole('button', { name: 'Save assignee' })).toBeEnabled();
    await user.selectOptions(select, 'Not assigned');
    expect(screen.getByRole('button', { name: 'Save assignee' })).toBeDisabled();
  });

  test('assigning an open request sends the person, and says it moved to In review', async () => {
    const user = userEvent.setup();
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    expect(screen.getByText('Assigning an open request also moves it to In review.')).toBeInTheDocument();
    const select = screen.getByLabelText('Assigned to');
    await waitFor(() => expect(select).toBeEnabled());

    await user.selectOptions(select, 'Tara Tan (TA)');
    apiFetch.mockResolvedValueOnce({
      request: { ...openRequest, status: 'in_review', assignedTo: 2, assignee: tara },
      allowedStatuses: ['approved', 'in_progress', 'blocked', 'rejected'],
    });
    await user.click(screen.getByRole('button', { name: 'Save assignee' }));

    expect(apiFetch).toHaveBeenLastCalledWith('/api/requests/7/assignee', { method: 'PATCH', json: { assigneeId: 2 } });
    expect(await screen.findByRole('status')).toHaveTextContent('Assigned to Tara Tan. Its status is now In review.');
    expect(screen.getByLabelText('Assigned to')).toHaveValue('2');
    expect(screen.getByRole('button', { name: 'Save assignee' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move to Approved' })).toBeInTheDocument(); // the next statuses came with it
  });

  test('choosing "Not assigned" removes the assignee', async () => {
    const user = userEvent.setup();
    const assigned = { ...openRequest, status: 'in_review', assignedTo: 2, assignee: tara };
    loaded = { request: assigned, allowedStatuses: ['approved'] };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    const select = screen.getByLabelText('Assigned to');
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveValue('2');

    await user.selectOptions(select, 'Not assigned');
    apiFetch.mockResolvedValueOnce({ request: { ...assigned, assignedTo: null, assignee: null }, allowedStatuses: ['approved'] });
    await user.click(screen.getByRole('button', { name: 'Save assignee' }));

    expect(apiFetch).toHaveBeenLastCalledWith('/api/requests/7/assignee', { method: 'PATCH', json: { assigneeId: null } });
    expect(await screen.findByRole('status')).toHaveTextContent('The request is not assigned to anyone now.');
  });

  test('someone who is no longer in the list is still shown as the current assignee', async () => {
    const gone = person(9, 'Gone', 'Person');
    loaded = { request: { ...openRequest, status: 'in_review', assignedTo: 9, assignee: gone }, allowedStatuses: ['approved'] };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    const select = screen.getByLabelText('Assigned to');
    await waitFor(() => expect(select).toBeEnabled());
    expect(select).toHaveValue('9');
    expect(within(select).getByRole('option', { name: 'Gone Person' })).toBeInTheDocument();
  });

  test('a restricted request can only be assigned by the Lab Manager', async () => {
    me = { userId: 3, role: 'lecturer' };
    loaded = {
      request: { ...openRequest, type: 'industry_collaboration', industryDetail: restrictedDetail, assignedTo: 3, assignee: person(3, 'Lee', 'Lecturer') },
      allowedStatuses: ['in_review'],
    };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });

    expect(screen.getByLabelText('Assigned to')).toBeDisabled();
    expect(screen.getByText('Only the Lab Manager can assign a restricted request.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to In review' })).toBeEnabled(); // moving it along is still fine
  });

  test('the Lab Manager can assign a restricted request', async () => {
    loaded = { request: { ...openRequest, type: 'industry_collaboration', industryDetail: restrictedDetail }, allowedStatuses: ['in_review'] };
    render(<RequestDetailPage />);
    await screen.findByRole('heading', { name: 'Manage request' });
    await waitFor(() => expect(screen.getByLabelText('Assigned to')).toBeEnabled());
  });

  test('if the list of people cannot be loaded it says so, and the status buttons still work', async () => {
    apiFetch.mockImplementation(async () => {
      throw new ApiError(500, 'Database is down');
    });
    render(<RequestDetailPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('The list of people could not be loaded: Database is down');
    expect(screen.getByLabelText('Assigned to')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move to In review' })).toBeEnabled();
  });
});

describe('everyone else', () => {
  test('a member sees the request but gets no controls, and nothing extra is fetched', async () => {
    me = { userId: 5, role: 'member' };
    loaded = { request: openRequest, allowedStatuses: [] };
    render(<RequestDetailPage />);

    expect(await screen.findByRole('heading', { name: /Fix backup script/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Manage request' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save assignee' })).not.toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  test('a restricted request you may not see shows the notice and no controls', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ error: 'Access restricted.', restricted: true }, 403)));
    render(<RequestDetailPage />);

    expect(await screen.findByText(/This request is restricted/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Manage request' })).not.toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
