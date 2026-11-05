// services/dashboard/myWork.js — the logged-in person's own work: next session, requests, notifications.
// Every query is limited to `userId`, so nobody sees someone else's items here.
const { countByStatus, activeTotal } = require('./helpers');

const UPCOMING_SESSION_STATUSES = ['pending_approval', 'approved', 'scheduled', 'in_progress'];
const LATEST_NOTIFICATIONS = 5;

/** The session this person requested or joined that ends next (running ones count). */
async function nextSession(prisma, userId, now) {
  const session = await prisma.labSession.findFirst({
    where: {
      archived: false,
      status: { in: UPCOMING_SESSION_STATUSES },
      requestedEnd: { gt: now },
      OR: [{ requestedBy: userId }, { participants: { some: { userId } } }],
    },
    orderBy: { requestedStart: 'asc' },
    select: {
      labSessionId: true,
      name: true,
      status: true,
      requestedStart: true,
      requestedEnd: true,
      room: { select: { roomId: true, name: true } },
    },
  });
  if (!session) return null;

  const { requestedStart, requestedEnd, ...rest } = session;
  return { ...rest, start: requestedStart, end: requestedEnd };
}

/** The person's own requests, counted by status. */
async function requestSummary(prisma, userId) {
  const groups = await prisma.request.groupBy({
    by: ['status'],
    where: { requesterId: userId },
    _count: { _all: true },
  });
  const counts = countByStatus(groups);
  return { counts, active: activeTotal(counts) };
}

/** Unread count plus the newest few unread notifications. */
async function notificationSummary(prisma, userId) {
  const where = { userId, isRead: false };
  const [unread, latest] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { notificationId: 'desc' },
      take: LATEST_NOTIFICATIONS,
      select: { notificationId: true, message: true, notifType: true, createdAt: true, requestId: true, labSessionId: true },
    }),
  ]);
  return { unread, latest };
}

async function myWork(prisma, user, now) {
  const [session, requests, notifications] = await Promise.all([
    nextSession(prisma, user.userId, now),
    requestSummary(prisma, user.userId),
    notificationSummary(prisma, user.userId),
  ]);
  return { nextSession: session, requests, notifications };
}

module.exports = { nextSession, requestSummary, notificationSummary, myWork };
