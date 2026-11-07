// services/dashboard/sessionQueue.js — lab sessions waiting for approval, for the people who approve them.
const QUEUE_LENGTH = 5;

const PENDING = { status: 'pending_approval', archived: false };

/** Sessions waiting for approval, soonest first, with who asked (approvers see this on the sessions page too). */
async function pendingSessionQueue(prisma) {
  const [total, sessions] = await Promise.all([
    prisma.labSession.count({ where: PENDING }),
    prisma.labSession.findMany({
      where: PENDING,
      orderBy: { requestedStart: 'asc' },
      take: QUEUE_LENGTH,
      select: {
        labSessionId: true,
        name: true,
        requestedStart: true,
        requestedEnd: true,
        room: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);
  const items = sessions.map(({ requestedStart, requestedEnd, room, requester, ...rest }) => ({
    ...rest,
    start: requestedStart,
    end: requestedEnd,
    roomName: room.name,
    requestedBy: `${requester.firstName} ${requester.lastName}`.trim(),
  }));
  return { total, items };
}

module.exports = { QUEUE_LENGTH, pendingSessionQueue };
