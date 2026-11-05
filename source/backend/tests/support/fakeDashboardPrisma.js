// A fake Prisma client for the dashboard tests. Every call is recorded in `calls`, so tests can check
// WHICH filter was used (for example "only this user's requests"), not only what came back.
function makeFakePrisma(data = {}) {
  const calls = [];
  const record = (name, result) => async (args = {}) => {
    calls.push({ name, args });
    return typeof result === 'function' ? result(args) : result;
  };
  const d = {
    users: [],
    sessions: [],
    pendingList: [],
    recentRequests: [],
    unassignedList: [],
    requestGroups: [],
    requestCount: 0,
    maintenance: [],
    notificationCount: 0,
    notifications: [],
    consumables: [],
    equipment: [],
    rooms: [],
    busySessions: [],
    pendingSessions: 0,
    newMembers: 0,
    ...data,
  };

  const prisma = {
    user: {
      findUnique: record('user.findUnique', ({ where }) => d.users.find((u) => u.userId === where.userId) ?? null),
      count: record('user.count', d.newMembers),
    },
    labSession: {
      count: record('labSession.count', d.pendingSessions),
      // one findMany serves three questions; tell them apart by the filter
      findMany: record('labSession.findMany', ({ where }) => {
        if (where.OR) return d.sessions;
        if (where.status === 'pending_approval') return d.pendingList;
        return d.busySessions;
      }),
    },
    request: {
      groupBy: record('request.groupBy', d.requestGroups),
      count: record('request.count', d.requestCount),
      findMany: record('request.findMany', ({ where }) => {
        if (where.requesterId !== undefined) return d.recentRequests;
        if (where.type === 'maintenance') return d.maintenance;
        return d.unassignedList;
      }),
    },
    notification: {
      count: record('notification.count', d.notificationCount),
      findMany: record('notification.findMany', d.notifications),
    },
    consumable: { findMany: record('consumable.findMany', d.consumables) },
    equipment: { findMany: record('equipment.findMany', d.equipment) },
    labRoom: { findMany: record('labRoom.findMany', d.rooms) },
  };
  return { prisma, calls, callsTo: (name) => calls.filter((c) => c.name === name) };
}

module.exports = { makeFakePrisma };
