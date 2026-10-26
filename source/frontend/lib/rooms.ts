// lib/rooms.ts — shared room helpers.
//
// Room codes look like 2(floor)01: the floor is everything before the last two
// digits (201 -> floor 2, 305 -> floor 3, 1204 -> floor 12). The code is read from
// the start of the room's `name`. To change how floors are worked out, edit
// floorOf() only; the pages all use it.

export type Room = {
  roomId: number;
  name: string;
  capacity: number | null;
  location: string | null;
};

/** Floor number from the room code, or null if the name doesn't start with a 3+ digit code. */
export function floorOf(name: string): number | null {
  const m = name.trim().match(/^(\d{3,})/);
  if (!m) return null;
  return Number(m[1].slice(0, -2));
}

export function floorLabel(floor: number | null): string {
  if (floor === null) return 'Other';
  if (floor === 0) return 'Ground floor';
  return `Floor ${floor}`;
}

export const compareRooms = (a: Room, b: Room) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

/** Groups rooms by floor: floors ascending, rooms without a code last under "Other". */
export function groupByFloor(rooms: Room[]): { key: string; floor: number | null; rooms: Room[] }[] {
  const map = new Map<number | null, Room[]>();
  for (const room of [...rooms].sort(compareRooms)) {
    const floor = floorOf(room.name);
    map.set(floor, [...(map.get(floor) ?? []), room]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
    .map(([floor, list]) => ({ key: String(floor ?? 'other'), floor, rooms: list }));
}