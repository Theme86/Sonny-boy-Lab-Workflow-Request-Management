// app/sessions/new/page.tsx — weekly slot picker for booking a lab room.
// 7 days x 24 hourly slots inside a scrollable box. Click (or click-and-drag) to
// select hours; separate blocks (10-11, 13-15) become separate sessions that are
// submitted together.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/ProfileView';
import { apiFetch } from '@/lib/api';
import { ui } from '@/lib/ui';

type Room = { roomId: number; name: string };
type Busy = { start: string; end: string; mine: boolean; status: string };
type Range = { start: number; end: number };

const HOUR = 3_600_000;
const ROW_H = 40;
const MAX_RANGES = 12;
const FIRST_VISIBLE_HOUR = 8;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

// ---------- date helpers (all local time; Bangkok has no DST) ----------

function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

function slotTime(weekStart: Date, dayIdx: number, hour: number) {
  return new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + dayIdx,
    hour,
  ).getTime();
}

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dayLabel = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

export default function NewSessionPage() {
  return (
    <AppShell>
      <Reserve />
    </AppShell>
  );
}

function Reserve() {
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [busy, setBusy] = useState<Busy[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const paint = useRef<'add' | 'remove' | null>(null);

  // ---------- data ----------

  useEffect(() => {
    apiFetch<Room[]>('/api/lab-rooms')
      .then((list) => {
        setRooms(list);
        if (list.length > 0) setRoomId(list[0].roomId);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (roomId === null) return;
    let cancelled = false;
    const from = weekStart.toISOString();
    const to = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + 7,
    ).toISOString();

    apiFetch<Busy[]>(`/api/lab-rooms/${roomId}/availability?from=${from}&to=${to}`)
      .then((data) => {
        if (!cancelled) setBusy(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, weekStart]);

  // open the box scrolled to working hours
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = FIRST_VISIBLE_HOUR * ROW_H;
  }, [weekStart, roomId]);

  // stop painting when the mouse is released anywhere
  useEffect(() => {
    const stop = () => {
      paint.current = null;
    };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  // ---------- derived ----------

  const days = useMemo(
    () =>
      Array.from(
        { length: 7 },
        (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i),
      ),
    [weekStart],
  );

  // 'booked' = holds the room, 'mine' = my own pending request
  const slotState = useMemo(() => {
    const map = new Map<number, 'booked' | 'mine'>();
    for (let d = 0; d < 7; d++) {
      for (const h of HOURS) {
        const t = slotTime(weekStart, d, h);
        let state: 'booked' | 'mine' | null = null;
        for (const b of busy) {
          if (Date.parse(b.start) < t + HOUR && Date.parse(b.end) > t) {
            if (b.status === 'pending_approval') state = state ?? 'mine';
            else state = 'booked';
          }
        }
        if (state) map.set(t, state);
      }
    }
    return map;
  }, [busy, weekStart]);

  // consecutive selected hours merge into one range
  const ranges = useMemo<Range[]>(() => {
    const sorted = [...selected].sort((a, b) => a - b);
    const out: Range[] = [];
    for (const t of sorted) {
      const last = out[out.length - 1];
      if (last && last.end === t) last.end = t + HOUR;
      else out.push({ start: t, end: t + HOUR });
    }
    return out;
  }, [selected]);

  const now = Date.now();
  const isBlocked = (t: number) => t + HOUR <= now || slotState.has(t);

  // ---------- selection ----------

  function applyCell(t: number, mode: 'add' | 'remove') {
    setSelected((prev) => {
      const next = new Set(prev);
      if (mode === 'add') next.add(t);
      else next.delete(t);
      return next;
    });
  }

  function onCellDown(t: number) {
    if (isBlocked(t)) return;
    const mode = selected.has(t) ? 'remove' : 'add';
    paint.current = mode;
    applyCell(t, mode);
  }

  function onCellEnter(t: number) {
    if (paint.current && !isBlocked(t)) applyCell(t, paint.current);
  }

  function removeRange(r: Range) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (let t = r.start; t < r.end; t += HOUR) next.delete(t);
      return next;
    });
  }

  function shiftWeek(n: number) {
    setWeekStart(
      (w) => new Date(w.getFullYear(), w.getMonth(), w.getDate() + 7 * n),
    );
  }

  function changeRoom(id: number) {
    setRoomId(id);
    setSelected(new Set()); // selections belong to one room
  }

  // ---------- submit ----------

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (roomId === null || ranges.length === 0) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/api/lab-sessions/batch', {
        method: 'POST',
        json: {
          name: name.trim(),
          description: description.trim() || null,
          roomId,
          slots: ranges.map((r) => ({
            start: new Date(r.start).toISOString(),
            end: new Date(r.end).toISOString(),
          })),
        },
      });
      router.push('/labsessions');
    } catch (err) {
      // e.g. 409 "Room is already booked for that time (session #12)"
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const weekLabel = `${days[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString(
    undefined,
    { day: 'numeric', month: 'short', year: 'numeric' },
  )}`;

  const btn =
    'rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-gray-300 hover:bg-gray-100 dark:ring-gray-600 dark:hover:bg-gray-800';
  const input =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600';
  const edge = 'border-b border-r border-gray-200 dark:border-gray-700';
  const sticky = 'bg-white dark:bg-neutral-900';

  return (
    <div>
      <PageHeading title="Book a lab room" subtitle="Pick one or more hours. Your request goes to a manager for approval." />

      {/* toolbar: room + week bar (stays outside the scroll box) */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Room{' '}
          <select
            value={roomId ?? ''}
            onChange={(e) => changeRoom(Number(e.target.value))}
            className="ml-1 rounded-lg border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-gray-600"
          >
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shiftWeek(-1)} className={btn} aria-label="Previous week">
            ‹
          </button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))} className={btn}>
            Today
          </button>
          <button type="button" onClick={() => shiftWeek(1)} className={btn} aria-label="Next week">
            ›
          </button>
          <span className="text-sm font-medium">{weekLabel}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* the scrollable grid box */}
        <div>
          <div
            ref={scrollRef}
            className={`${ui.card} select-none overflow-auto`}
            style={{ height: '65vh', minHeight: 320 }}
          >
            <div
              className="grid"
              style={{ gridTemplateColumns: '56px repeat(7, minmax(88px, 1fr))', minWidth: 56 + 7 * 88 }}
            >
              {/* header row */}
              <div className={`sticky left-0 top-0 z-30 ${sticky} ${edge}`} style={{ height: ROW_H }} />
              {days.map((d) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={d.toISOString()}
                    className={`sticky top-0 z-20 flex items-center justify-center text-xs font-medium ${sticky} ${edge} ${
                      isToday ? 'text-[#0b57d0] dark:text-[#a8c7fa]' : ''
                    }`}
                    style={{ height: ROW_H }}
                  >
                    {d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  </div>
                );
              })}

              {/* hour rows */}
              {HOURS.map((h) => (
                <FragmentRow key={h}>
                  <div
                    className={`sticky left-0 z-10 flex items-start justify-end pr-2 pt-1 text-xs ${ui.muted} ${sticky} ${edge}`}
                    style={{ height: ROW_H }}
                  >
                    {pad(h)}:00
                  </div>
                  {days.map((_, dayIdx) => {
                    const t = slotTime(weekStart, dayIdx, h);
                    const state = slotState.get(t);
                    const past = t + HOUR <= now;
                    const isSel = selected.has(t);

                    let cls = 'hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer';
                    let title = 'Click to select';
                    if (past) {
                      cls = 'bg-gray-50 opacity-50 cursor-not-allowed dark:bg-neutral-800';
                      title = 'In the past';
                    } else if (state === 'booked') {
                      cls = 'bg-gray-300 cursor-not-allowed dark:bg-gray-700';
                      title = 'Booked';
                    } else if (state === 'mine') {
                      cls = 'bg-amber-100 cursor-not-allowed dark:bg-amber-900/40';
                      title = 'Your pending request';
                    } else if (isSel) {
                      cls = 'bg-[#0b57d0] cursor-pointer';
                      title = 'Selected, click to remove';
                    }

                    return (
                      <div
                        key={t}
                        title={title}
                        className={`${edge} ${cls}`}
                        style={{ height: ROW_H }}
                        onMouseDown={() => onCellDown(t)}
                        onMouseEnter={() => onCellEnter(t)}
                      />
                    );
                  })}
                </FragmentRow>
              ))}
            </div>
          </div>

          <div className={`mt-2 flex flex-wrap gap-4 text-xs ${ui.muted}`}>
            <Legend color="bg-[#0b57d0]" label="Selected" />
            <Legend color="bg-gray-300 dark:bg-gray-700" label="Booked" />
            <Legend color="bg-amber-100 dark:bg-amber-900/40" label="Your pending request" />
          </div>
        </div>

        {/* request panel */}
        <form onSubmit={submit} className={`${ui.card} h-fit p-4`}>
          <h2 className="text-base font-medium">Your request</h2>

          <label className="mt-3 block text-sm">
            Session name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              required
              className={input}
            />
          </label>
          <label className="mt-3 block text-sm">
            Description (optional)
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
              rows={3}
              className={input}
            />
          </label>

          <div className="mt-4">
            <p className="text-sm font-medium">
              Time slots ({ranges.length}/{MAX_RANGES})
            </p>
            {ranges.length === 0 && <p className={`mt-1 text-sm ${ui.muted}`}>Select hours in the grid.</p>}
            <ul className="mt-1 grid gap-1">
              {ranges.map((r) => (
                <li key={r.start} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {dayLabel(r.start)} · {hhmm(r.start)}–{hhmm(r.end)}
                  </span>
                  <button type="button" onClick={() => removeRange(r)} className={`text-xs ${ui.muted} underline`}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim() || ranges.length === 0 || ranges.length > MAX_RANGES}
            className="mt-4 w-full rounded-full bg-[#0b57d0] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Sending...' : ranges.length > 1 ? `Request ${ranges.length} slots` : 'Request booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

// grid children must be direct items of the grid, so a fragment groups one row
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${color}`} />
      {label}
    </span>
  );
}