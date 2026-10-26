// app/rooms/new/page.tsx — lab managers only
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PageHeading } from '@/components/ProfileView';
import RoomForm, { type RoomInput } from '@/components/RoomForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiFetch } from '@/lib/api';
import type { Room } from '@/lib/rooms';
import { ui } from '@/lib/ui';

export default function NewRoomPage() {
  return (
    <AppShell>
      <NewRoom />
    </AppShell>
  );
}

function NewRoom() {
  const { user } = useCurrentUser();
  const router = useRouter();

  if (!user) return null;
  if (user.role !== 'lab_manager') {
    return (
      <div>
        <PageHeading title="New room" subtitle="Only lab managers can add rooms." />
        <Link href="/rooms" className={ui.muted}>
          ← Back to rooms
        </Link>
      </div>
    );
  }

  async function saveRoom(data: RoomInput, roomId?: number) {
    const room = await apiFetch<Room>(roomId ? `/api/lab-rooms/${roomId}` : '/api/lab-rooms', {
      method: roomId ? 'PATCH' : 'POST',
      json: data,
    });
    return room;
  }

  function complete() {
    router.push('/rooms');
  }

  return (
    <div>
      <PageHeading title="New room" subtitle="Add a lab room to the list." />
      <RoomForm submitLabel="Create room" onSubmit={saveRoom} onComplete={complete} />
    </div>
  );
}