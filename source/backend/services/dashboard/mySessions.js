// services/dashboard/mySessions.js — the sessions a person requested or joined that are still ahead (or running).
const UPCOMING_SESSION_STATUSES = ['pending_approval', 'approved', 'scheduled', 'in_progress'];
const UPCOMING_SESSIONS = 5;

/** Sessions this person requested or joined that have not ended yet (running ones count), soonest first. */
async function upcomingSessions(prisma, userId, now) {
  const sessions = await prisma.labSession.findMany({
    where: {
      archived: false,
      status: { in: UPCOMING_SESSION_STATUSES },
      requestedEnd: { gt: now },
      OR: [{ requestedBy: userId }, { participants: { some: { userId } } }],
    },
    orderBy: { requestedStart: 'asc' },
    take: UPCOMING_SESSIONS,
    select: {
      labSessionId: true,
      name: true,
      status: true,
      requestedStart: true,
      requestedEnd: true,
      room: { select: { roomId: true, name: true } },
    },
  });
  return sessions.map(({ requestedStart, requestedEnd, ...rest }) => ({ ...rest, start: requestedStart, end: requestedEnd }));
}

module.exports = { UPCOMING_SESSION_STATUSES, upcomingSessions };
