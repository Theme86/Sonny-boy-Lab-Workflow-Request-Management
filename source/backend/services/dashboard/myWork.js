// services/dashboard/myWork.js — the logged-in person's own work: upcoming sessions, requests, notifications.
// Every query is limited to `userId`, so nobody sees someone else's items here.
const { countByStatus, activeTotal } = require('./helpers');
const { upcomingSessions } = require('./mySessions');

const LATEST_NOTIFICATIONS = 5;
const RECENT_REQUESTS = 5;

/** The person's newest requests. */
const recentRequests = (prisma, userId) =>
  prisma.request.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: 'desc' },
    take: RECENT_REQUESTS,
    select: { requestId: true, title: true, type: true, status: true, createdAt: true },
  });

/** The person's own requests: counted by status, plus the newest few. */
async function requestSummary(prisma, userId) {
  const [groups, recent] = await Promise.all([
    prisma.request.groupBy({ by: ['status'], where: { requesterId: userId }, _count: { _all: true } }),
    recentRequests(prisma, userId),
  ]);
  const counts = countByStatus(groups);
  return { counts, active: activeTotal(counts), recent };
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
  const [sessions, requests, notifications] = await Promise.all([
    upcomingSessions(prisma, user.userId, now),
    requestSummary(prisma, user.userId),
    notificationSummary(prisma, user.userId),
  ]);
  return { upcomingSessions: sessions, requests, notifications };
}

module.exports = { recentRequests, requestSummary, notificationSummary, myWork };
