// app/rooms/page.tsx — room list on the left (grouped by floor), details on the right.
// Everyone can browse; creating, editing and deleting is for lab managers only
// (the API enforces this too).
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { ChevronRightIcon } from '@/components/icons';
import { PageHeading } from '@/components/ProfileView';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import { floorLabel, floorOf, groupByFloor, type Room } from '@/lib/rooms';
import { ui } from '@/lib/ui';

export default function RoomsPage() {
  return (
    <AppShell>
      <Rooms />
    </AppShell>
  );
}

function Rooms() {
  const { user } = useCurrentUser();
  const isManager = user?.role === 'lab_manager';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    apiFetch<Room[]>('/api/lab-rooms')
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? rooms.filter((r) => r.name.toLowerCase().includes(q) || (r.location ?? '').toLowerCase().includes(q))
      : rooms;
    return groupByFloor(filtered);
  }, [rooms, query]);

  // the selected room, or the first one in the list when nothing is picked yet
  const visible = groups.flatMap((g) => g.rooms);
  const selected = visible.find((r) => r.roomId === selectedId) ?? visible[0] ?? null;

  function toggleFloor(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function removeRoom(room: Room) {
    if (!confirm(`Delete room ${room.name}?`)) return;
    setDeleting(true);
    setError('');
    try {
      await apiFetch(`/api/lab-rooms/${room.roomId}`, { method: 'DELETE' });
      setRooms((prev) => prev.filter((r) => r.roomId !== room.roomId));
      setSelectedId(null);
    } catch (err) {
      // 409 when sessions still use this room
      setError(`Could not delete room ${room.name}: ${(err as Error).message}`);
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  const btnOutline =
    'inline-flex h-9 items-center rounded-full px-4 text-sm font-medium ring-1 ring-inset ring-gray-300 hover:bg-gray-100 disabled:opacity-50 dark:ring-gray-600 dark:hover:bg-gray-800';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeading title="Rooms" subtitle="Browse lab rooms by floor." />
        {isManager && (
          <Link
            href="/rooms/new"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#0b57d0] px-5 text-sm font-medium whitespace-nowrap text-white hover:bg-[#0a4cb8]"
          >
            <span aria-hidden className="text-lg leading-none">+</span>
            New room
          </Link>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {loading && <p className={ui.muted}>Loading...</p>}
      {!loading && rooms.length === 0 && !error && <p className={ui.muted}>No rooms yet.</p>}

      {rooms.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* left: list with a divider per floor */}
          <div className={`${ui.card} flex max-h-[70vh] flex-col overflow-hidden`}>
            <div className="border-b border-gray-200 p-3 dark:border-gray-700">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search room or location"
                aria-label="Search rooms"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600"
              />
            </div>

            <div className="overflow-y-auto">
              {groups.length === 0 && <p className={`p-4 text-sm ${ui.muted}`}>No rooms match.</p>}
              {groups.map((group) => {
                const isCollapsed = collapsed.has(group.key);
                return (
                  <section key={group.key}>
                    <button
                      type="button"
                      onClick={() => toggleFloor(group.key)}
                      aria-expanded={!isCollapsed}
                      className="sticky top-0 z-10 flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 text-left text-xs font-semibold tracking-wide uppercase dark:border-gray-700 dark:bg-neutral-800"
                    >
                      <ChevronRightIcon
                        width={14}
                        height={14}
                        className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                      />
                      {floorLabel(group.floor)}
                      <span className={`ml-auto font-normal normal-case ${ui.muted}`}>
                        {group.rooms.length} {group.rooms.length === 1 ? 'room' : 'rooms'}
                      </span>
                    </button>

                    {!isCollapsed && (
                      <ul>
                        {group.rooms.map((room) => {
                          const active = selected?.roomId === room.roomId;
                          return (
                            <li key={room.roomId}>
                              <button
                                type="button"
                                onClick={() => setSelectedId(room.roomId)}
                                aria-current={active ? 'true' : undefined}
                                className={`flex w-full flex-col px-4 py-2.5 text-left ${
                                  active
                                    ? 'bg-[#d3e3fd] text-[#041e49] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                              >
                                <span className="text-sm font-medium">{room.name}</span>
                                <span className={`text-xs ${active ? 'opacity-80' : ui.muted}`}>
                                  {room.location ?? 'No location'}
                                  {room.capacity ? ` · ${room.capacity} seats` : ''}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </div>

          {/* right: details of the selected room */}
          <div className={`${ui.card} h-fit p-6`}>
            {!selected ? (
              <p className={ui.muted}>Select a room to see its details.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm ${ui.muted}`}>{floorLabel(floorOf(selected.name))}</p>
                    <h2 className="text-[22px]">Room {selected.name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/labsessions/new" className={btnOutline}>
                      Book this room
                    </Link>
                    {isManager && (
                      <>
                        <Link href={`/rooms/${selected.roomId}/edit`} className={btnOutline}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => removeRoom(selected)}
                          className={`${btnOutline} text-red-600`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Detail label="Capacity" value={selected.capacity ? `${selected.capacity} seats` : '-'} />
                  <Detail label="Location" value={selected.location ?? '-'} />
                  <Detail label="Floor" value={floorLabel(floorOf(selected.name))} />
                  <Detail label="Database ID" value={String(selected.roomId)} />
                </dl>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={`text-xs tracking-wide uppercase ${ui.muted}`}>{label}</dt>
      <dd className="mt-1 text-base">{value}</dd>
    </div>
  );
}