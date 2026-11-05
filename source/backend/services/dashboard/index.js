// services/dashboard/index.js — puts the dashboard together for one person.
// Each part lives in its own file; this file only decides what goes in and in which shape.
const { attention } = require('./attention');
const { consumableSummary, equipmentSummary } = require('./inventory');
const { myWork } = require('./myWork');
const { roomSummary } = require('./rooms');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param prisma  the Prisma client (passed in so tests can use a fake)
 * @param user    { userId, role } of the logged-in person (role read from the database)
 * @param options { now, from, to } – the room timeline covers from..to, by default the next 24 hours
 */
async function buildDashboard(prisma, user, options = {}) {
  const now = options.now ?? new Date();
  const window = { from: options.from ?? now, to: options.to ?? new Date(now.getTime() + DAY_MS) };

  const [me, consumables, equipment, rooms, needsAttention] = await Promise.all([
    myWork(prisma, user, now),
    consumableSummary(prisma, now),
    equipmentSummary(prisma),
    roomSummary(prisma, window, now),
    attention(prisma, user, now),
  ]);

  return {
    generatedAt: now,
    role: user.role,
    me,
    lab: { consumables, equipment, rooms },
    attention: needsAttention,
  };
}

module.exports = { buildDashboard };
