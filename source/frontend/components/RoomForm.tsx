// components/RoomForm.tsx — shared by rooms/new and rooms/[id]/edit
'use client';

import { useState } from 'react';
import { floorLabel, floorOf } from '@/lib/rooms';
import { ui } from '@/lib/ui';

export type RoomInput = {
  name: string;
  capacity: number | null;
  location: string | null;
};

type Props = {
  initial?: RoomInput;
  submitLabel: string;
  onSubmit: (data: RoomInput) => Promise<void>;
};

export default function RoomForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const floor = floorOf(name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        capacity: capacity ? Number(capacity) : null,
        location: location.trim() || null,
      });
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

      {error && <p className="text-sm text-red-600">{error}</p>}

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