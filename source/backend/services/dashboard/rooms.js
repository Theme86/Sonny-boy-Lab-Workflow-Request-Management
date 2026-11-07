// services/dashboard/rooms.js — which rooms are busy in a time window.
// Only times are returned, never who booked (the same rule as GET /api/lab-rooms/:id/availability),
// so members cannot see other people's sessions.

// statuses that hold a room (the same list the session routes use for their overlap check)
const BLOCKING_STATUSES = ['approved', 'scheduled', 'in_progress'];

/** { roomId -> [{ start, end }] } in the order given. */
function groupBusyByRoom(sessions) {
  const busy = new Map();
  for (const { roomId, requestedStart, requestedEnd } of sessions) {
    if (!busy.has(roomId)) busy.set(roomId, []);
    busy.get(roomId).push({ start: requestedStart, end: requestedEnd });
  }
  return busy;
}

const isBusyAt = (intervals, at) => intervals.some(({ start, end }) => start <= at && at < end);

async function roomSummary(prisma, { from, to }, now) {
  const [rooms, sessions] = await Promise.all([
    prisma.labRoom.findMany({ orderBy: { name: 'asc' }, select: { roomId: true, name: true } }),
    prisma.labSession.findMany({
      where: {
        archived: false,
        status: { in: BLOCKING_STATUSES },
        requestedStart: { lt: to },
        requestedEnd: { gt: from },
      },
      orderBy: { requestedStart: 'asc' },
      select: { roomId: true, requestedStart: true, requestedEnd: true },
    }),
  ]);

  const busyByRoom = groupBusyByRoom(sessions);
  return {
    from,
    to,
    rooms: rooms.map((room) => {
      const busy = busyByRoom.get(room.roomId) ?? [];
      return { ...room, busy, inUseNow: isBusyAt(busy, now) };
    }),
  };
}

module.exports = { BLOCKING_STATUSES, groupBusyByRoom, isBusyAt, roomSummary };
