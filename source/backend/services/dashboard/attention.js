// services/dashboard/attention.js — "needs attention": things a person with the right role has to act on.
// Each part is only fetched for the roles that may act on it (see access.js), so the other roles never
// receive the numbers at all, not even hidden.
const { attentionAccess } = require('./access');
const { requestAttention, unassignedQueue } = require('./requestAttention');
const { pendingSessionQueue } = require('./sessionQueue');

const NEW_MEMBER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

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
