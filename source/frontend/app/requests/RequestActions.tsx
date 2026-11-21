// app/requests/RequestActions.tsx
// "Manage request" panel on the request detail page. Lab staff (TA, lecturer, lab manager) move the request
// to its next status and assign it: the triage and closing flow from the README.
// The backend decides what is allowed (it sends `allowedStatuses` and refuses the rest); this only shows the controls.
'use client';

import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api';
import { STATUS_LABELS, fullName, type Assignee, type RequestDetail, type RequestDetailResponse } from '@/lib/requests';
import { assignBlockedReason, assigneeLabel, isStaffRole, needsConfirm, statusActionLabel } from '@/lib/requestActions';
import { ui } from '@/lib/ui';

type Props = {
  request: RequestDetail;
  /** What this person may move the request to right now, as sent by the backend. */
  allowedStatuses: string[];
  /** The signed-in person's role. */
  role: string;
  /** Called with the backend's answer after a change went through. */
  onUpdated: (result: RequestDetailResponse) => void;
  /** Called when the backend says someone else changed the request first (409), so the page can load it again. */
  onConflict: () => void;
};

type Notice = { kind: 'success' | 'error'; text: string };

export default function RequestActions(props: Props) {
  // Members only read their request (and the backend refuses them anyway).
  if (!isStaffRole(props.role)) return null;
  return <ManagePanel {...props} />;
}

function ManagePanel({ request, allowedStatuses, role, onUpdated, onConflict }: Props) {
  const [assignees, setAssignees] = useState<Assignee[] | null>(null); // null until the list of people has loaded
  const [assigneesError, setAssigneesError] = useState('');
  const [choice, setChoice] = useState<string | null>(null); // null = nothing picked yet, so show the current assignee
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ assignees: Assignee[] }>('/api/requests/assignees')
      .then((data) => !cancelled && setAssignees(data.assignees))
      .catch((err) => !cancelled && setAssigneesError(err?.message ?? 'Please try again'));
    return () => {
      cancelled = true;
    };
  }, []);

  const current = request.assignedTo === null ? '' : String(request.assignedTo);
  const selected = choice ?? current;
  const blockedReason = assignBlockedReason(request, role);
  const listReady = assignees !== null;
  // The current assignee may no longer be in the list (deactivated, or no longer staff): keep showing them.
  const currentInList = request.assignedTo === null || !!assignees?.some((a) => a.userId === request.assignedTo);
  const hint = blockedReason ?? (request.status === 'open' ? 'Assigning an open request also moves it to In review.' : '');

  async function send(path: 'status' | 'assignee', body: object, success: (updated: RequestDetail) => string) {
    setBusy(true);
    setNotice(null);
    try {
      const result = await apiFetch<RequestDetailResponse>(`/api/requests/${request.requestId}/${path}`, {
        method: 'PATCH',
        json: body,
      });
      onUpdated(result);
      setChoice(null);
      setNotice({ kind: 'success', text: success(result.request) });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Someone else got there first: show what is true now instead of what this page remembers.
        setChoice(null);
        onConflict();
        setNotice({
          kind: 'error',
          text: 'Someone else changed this request just now, so it was reloaded. Check it and try again.',
        });
      } else {
        setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
      }
    } finally {
      setBusy(false);
    }
  }

  function changeStatus(next: string) {
    if (needsConfirm(next) && !window.confirm('Close this request? A closed request cannot be reopened or reassigned.')) {
      return;
    }
    void send('status', { status: next }, (updated) => `Status changed to ${STATUS_LABELS[updated.status] ?? updated.status}.`);
  }

  function saveAssignee() {
    const assigneeId = selected === '' ? null : Number(selected);
    void send('assignee', { assigneeId }, (updated) => {
      const who = updated.assignee ? `Assigned to ${fullName(updated.assignee)}.` : 'The request is not assigned to anyone now.';
      // The backend starts the review when an open request gets an assignee; say so.
      return updated.status === request.status
        ? who
        : `${who} Its status is now ${STATUS_LABELS[updated.status] ?? updated.status}.`;
    });
  }

  return (
    <section aria-labelledby="manage-request-heading" className={`mt-8 space-y-5 p-4 ${ui.card}`}>
      <h2 id="manage-request-heading" className="text-lg font-semibold">
        Manage request
      </h2>

      <div>
        <p id="change-status-label" className="mb-2 text-sm font-medium">
          Change status
        </p>
        {allowedStatuses.length > 0 ? (
          <div role="group" aria-labelledby="change-status-label" className="flex flex-wrap gap-2">
            {allowedStatuses.map((status) => (
              <button
                key={status}
                type="button"
                disabled={busy}
                onClick={() => changeStatus(status)}
                className={ui.btnOutline}
              >
                {statusActionLabel(status)}
              </button>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${ui.muted}`}>
            {request.status === 'closed'
              ? 'This request is closed, so its status can’t be changed.'
              : 'No status change is available right now.'}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="request-assignee" className="mb-2 block text-sm font-medium">
          Assigned to
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            id="request-assignee"
            value={selected}
            disabled={busy || !listReady || !!blockedReason}
            aria-describedby={hint ? 'request-assignee-hint' : undefined}
            onChange={(e) => setChoice(e.target.value)}
            className={`${ui.select} sm:w-72`}
          >
            <option value="">Not assigned</option>
            {!currentInList && request.assignee && <option value={current}>{fullName(request.assignee)}</option>}
            {assignees?.map((a) => (
              <option key={a.userId} value={String(a.userId)}>
                {assigneeLabel(a)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveAssignee}
            disabled={busy || !listReady || !!blockedReason || selected === current}
            className={ui.btnPrimary}
          >
            Save assignee
          </button>
        </div>
        {hint && (
          <p id="request-assignee-hint" className={`mt-2 text-sm ${ui.muted}`}>
            {hint}
          </p>
        )}
        {assigneesError && (
          <p role="alert" className={`mt-2 text-sm ${ui.errorText}`}>
            The list of people could not be loaded: {assigneesError}
          </p>
        )}
      </div>

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`text-sm ${notice.kind === 'error' ? ui.errorText : ''}`}
        >
          {notice.text}
        </p>
      )}
    </section>
  );
}
