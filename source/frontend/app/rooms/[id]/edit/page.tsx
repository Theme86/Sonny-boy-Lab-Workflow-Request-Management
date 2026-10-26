// app/rooms/[id]/edit/page.tsx — lab managers only
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/ProfileView';
import RoomForm, { type RoomInput } from '@/components/RoomForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import type { Room } from '@/lib/rooms';
import { ui } from '@/lib/ui';

export default function EditRoomPage() {
  return (
    <AppShell>
      <EditRoom />
    </AppShell>
  );
}

function EditRoom() {
  const { user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<Room>(`/api/lab-rooms/${id}`)
      .then(setRoom)
      .catch((err) => setError(err.message));
  }, [id]);

  if (!user) return null;
  if (user.role !== 'lab_manager') {
    return (
      <div>
        <PageHeading title="Edit room" subtitle="Only lab managers can edit rooms." />
        <Link href="/rooms" className={ui.muted}>
          ← Back to rooms
        </Link>
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!room) return <p className={ui.muted}>Loading...</p>;

  async function updateRoom(data: RoomInput) {
    await apiFetch(`/api/lab-rooms/${id}`, { method: 'PATCH', json: data });
    router.push('/rooms');
  }

  return (
    <div>
      <PageHeading title={`Edit room ${room.name}`} subtitle="Change the room's details." />
      <RoomForm initial={room} submitLabel="Save changes" onSubmit={updateRoom} />
    </div>
  );
}