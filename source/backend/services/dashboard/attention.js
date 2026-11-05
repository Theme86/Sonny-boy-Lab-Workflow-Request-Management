// services/dashboard/attention.js — "needs attention": things a person with the right role has to act on.
// Each part is only fetched for the roles that may act on it (see access.js), so the other roles never
// receive the numbers at all, not even hidden.
const { attentionAccess } = require('./access');
const { ACTIVE_REQUEST_STATUSES } = require('./helpers');
const { QUEUE_LENGTH, pendingSessionQueue } = require('./sessionQueue');

const NEW_MEMBER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const UNASSIGNED = { status: 'open', assignedTo: null };

/** The oldest open requests nobody has picked up (oldest first, like a queue), with the total. */
async function unassignedQueue(prisma) {
  const [total, items] = await Promise.all([
    prisma.request.count({ where: UNASSIGNED }),
    prisma.request.findMany({
      where: UNASSIGNED,
      orderBy: { createdAt: 'asc' },
      take: QUEUE_LENGTH,
      select: { requestId: true, title: true, type: true, priority: true, createdAt: true },
    }),
  ]);
  return { total, items };
}

/** Open requests nobody has picked up, blocked ones, those assigned to me, and equipment under repair. */
async function requestAttention(prisma, userId) {
  const [unassigned, blocked, assignedToMe, maintenance] = await Promise.all([
    unassignedQueue(prisma),
    prisma.request.count({ where: { status: 'blocked' } }),
    prisma.request.count({ where: { assignedTo: userId, status: { in: ACTIVE_REQUEST_STATUSES } } }),
    prisma.request.findMany({
      where: { type: 'maintenance', equipmentId: { not: null }, status: { in: ACTIVE_REQUEST_STATUSES } },
      select: { equipmentId: true, equipment: { select: { name: true } } },
    }),
  ]);

  const underMaintenance = [...new Map(maintenance.map((r) => [r.equipmentId, r.equipment.name]))].map(
    ([equipmentId, name]) => ({ equipmentId, name }),
  );
  return { unassigned, blocked, assignedToMe, underMaintenance };
}

/** Accounts created recently that still have the default role. */
const newMemberCount = (prisma, now) =>
  prisma.user.count({
    where: { role: 'member', active: true, createdAt: { gte: new Date(now.getTime() - NEW_MEMBER_DAYS * DAY_MS) } },
  });

/** Only the parts this role may see; null when it gets none of them. */
async function attention(prisma, user, now) {
  const access = attentionAccess(user.role);
  if (!Object.values(access).some(Boolean)) return null;

  const [requests, pendingSessions, newMembers] = await Promise.all([
    access.requests ? requestAttention(prisma, user.userId) : undefined,
    access.pendingSessions ? pendingSessionQueue(prisma) : undefined,
    access.newMembers ? newMemberCount(prisma, now) : undefined,
  ]);

  return {
    ...(requests && { requests }),
    ...(pendingSessions !== undefined && { pendingSessions }),
    ...(newMembers !== undefined && { newMembers }),
  };
}

module.exports = { NEW_MEMBER_DAYS, unassignedQueue, requestAttention, newMemberCount, attention };
