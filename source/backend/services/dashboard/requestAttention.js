// services/dashboard/requestAttention.js — the request part of "needs attention".
const { ACTIVE_REQUEST_STATUSES } = require('./helpers');
const { QUEUE_LENGTH } = require('./sessionQueue');
const { withVisibility } = require('../../utils/requestVisibility');

const UNASSIGNED = { status: 'open', assignedTo: null };

/** The oldest open requests nobody has picked up (oldest first, like a queue), with the total. */
async function unassignedQueue(prisma, user) {
  // restricted requests of other people stay out of the queue and its total (SRS-16)
  const where = withVisibility(UNASSIGNED, user);
  const [total, items] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: QUEUE_LENGTH,
      select: { requestId: true, title: true, type: true, priority: true, createdAt: true },
    }),
  ]);
  return { total, items };
}

/** Open requests nobody has picked up, blocked ones, those assigned to me, and equipment under repair. */
async function requestAttention(prisma, user) {
  const userId = user.userId;
  const [unassigned, blocked, assignedToMe, maintenance] = await Promise.all([
    unassignedQueue(prisma, user),
    prisma.request.count({ where: withVisibility({ status: 'blocked' }, user) }),
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

module.exports = { unassignedQueue, requestAttention };