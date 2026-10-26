// components/RoomForm.tsx — shared by rooms/new and rooms/[id]/edit
'use client';

import { useState } from 'react';
import { apiFetch, imageUrl as resolveImageUrl } from '@/lib/api';
import { floorLabel, floorOf } from '@/lib/rooms';
import { ui } from '@/lib/ui';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type RoomInput = {
  name: string;
  capacity: number | null;
  location: string | null;
};

type Props = {
  initial?: RoomInput & { roomId: number; imageUrl: string | null };
  submitLabel: string;
  onSubmit: (data: RoomInput, roomId?: number) => Promise<{ roomId: number; imageUrl: string | null }>;
  onComplete: () => void;
};

export default function RoomForm({ initial, submitLabel, onSubmit, onComplete }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [savedRoom, setSavedRoom] = useState<{ roomId: number; imageUrl: string | null } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const floor = floorOf(name);
  const roomImage = savedRoom ? savedRoom.imageUrl : initial?.imageUrl ?? null;

  function pickImage(file?: File) {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageFile(null);
      setImagePreview(null);
      setError('Choose a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      setImageFile(null);
      setImagePreview(null);
      setError('Choose an image of 5 MB or less.');
      return;
    }
    setImageFile(file);
    setRemoveImage(false);
    setError('');
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result));
    reader.onerror = () => setError('The image preview could not be loaded.');
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let room = await onSubmit({
        name: name.trim(),
        capacity: capacity ? Number(capacity) : null,
        location: location.trim() || null,
      }, savedRoom?.roomId);
      setSavedRoom(room);

      if (imageFile) {
        room = await apiFetch<typeof room>(`/api/lab-rooms/${room.roomId}/image`, {
          method: 'PUT',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });
        setSavedRoom(room);
      } else if (removeImage && roomImage) {
        room = await apiFetch<typeof room>(`/api/lab-rooms/${room.roomId}/image`, { method: 'DELETE' });
        setSavedRoom(room);
      }

      onComplete();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  const input =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-600';

  return (
    <form onSubmit={handleSubmit} className={`${ui.card} grid max-w-md gap-4 p-6`}>
      <label className="text-sm">
        Room code
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 201"
          maxLength={100}
          required
          className={input}
        />
        <span className={`mt-1 block text-xs ${ui.muted}`}>
          Format: floor + two digits (201 = floor 2, room 01).{' '}
          {name.trim() &&
            (floor === null
              ? 'No floor found, so this room will be listed under "Other".'
              : `Will be listed under ${floorLabel(floor)}.`)}
        </span>
      </label>

      <div className="text-sm">
        <span>Room picture</span>
        <div className="mt-1 grid h-40 w-full place-items-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
          {imagePreview || (!removeImage && roomImage) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview ?? resolveImageUrl(roomImage) ?? undefined} alt={`Room ${name || 'preview'}`} className="h-full w-full object-cover" />
          ) : (
            <span className={ui.muted}>No picture</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className={ui.btnOutline} onClick={() => document.getElementById('room-picture-input')?.click()}>
            {imageFile || roomImage ? 'Change picture' : 'Add picture'}
          </button>
          {imageFile ? (
            <button
              type="button"
              className={ui.btnText}
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              {roomImage ? 'Keep current picture' : 'Remove selected picture'}
            </button>
          ) : roomImage && !removeImage ? (
            <button type="button" className={ui.btnDanger} onClick={() => setRemoveImage(true)}>
              Remove picture
            </button>
          ) : removeImage ? (
            <button type="button" className={ui.btnText} onClick={() => setRemoveImage(false)}>
              Keep current picture
            </button>
          ) : null}
        </div>
        <p className={`mt-1 text-xs ${ui.muted}`}>
          {removeImage ? 'The picture will be removed when you save.' : 'JPG, PNG or WEBP, up to 5 MB'}
        </p>
        <input
          id="room-picture-input"
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            pickImage(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>

      <label className="text-sm">
        Capacity (optional)
        <input
          type="number"
          min={1}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className={input}
        />
      </label>

      <label className="text-sm">
        Location (optional)
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={100}
          placeholder="e.g. Science Building, east wing"
          className={input}
        />
      </label>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="h-10 rounded-full bg-[#0b57d0] px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}