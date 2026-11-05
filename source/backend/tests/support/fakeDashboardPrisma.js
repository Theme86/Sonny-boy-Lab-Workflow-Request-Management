// A fake Prisma client for the dashboard tests. Every call is recorded in `calls`, so tests can check
// WHICH filter was used (for example "only this user's requests"), not only what came back.
function makeFakePrisma(data = {}) {
  const calls = [];
  const record = (name, result) => async (args) => {
    calls.push({ name, args });
    return typeof result === 'function' ? result(args) : result;
  };
  const d = {
    users: [],
    session: null,
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
      findFirst: record('labSession.findFirst', d.session),
      count: record('labSession.count', d.pendingSessions),
      findMany: record('labSession.findMany', d.busySessions),
    },
    request: {
      groupBy: record('request.groupBy', d.requestGroups),
      count: record('request.count', d.requestCount),
      findMany: record('request.findMany', d.maintenance),
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
