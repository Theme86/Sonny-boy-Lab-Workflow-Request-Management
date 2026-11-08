// Expiry reminders with an in-memory fake Prisma (no database needed).
const test = require('node:test');
const assert = require('node:assert/strict');
const { sendExpiryReminders } = require('../services/expiryReminders');

const NOW = new Date('2026-11-15T03:00:00Z');
const day = (n) => new Date(Date.UTC(2026, 10, 15 + n)); // a @db.Date value n days from NOW's date

function fakeDb(consumables) {
  const db = {
    consumables,
    users: [
      { userId: 1, role: 'lab_manager', active: true },
      { userId: 2, role: 'lecturer', active: true },
      { userId: 3, role: 'member', active: true },
    ],
    notifications: [],
  };
  const prisma = {
    consumable: {
      findMany: async ({ where }) => db.consumables.filter((c) => c.expiryDate && c.expiryDate <= where.expiryDate.lte),
    },
    notification: {
      findFirst: async ({ where }) =>
        db.notifications.find((n) => n.consumableId === where.consumableId && n.notifType === where.notifType && n.message === where.message) ?? null,
      createMany: async ({ data }) => {
        db.notifications.push(...data);
      },
    },
    user: {
      findMany: async ({ where }) =>
        db.users.filter((u) => u.active === where.active && where.role.in.includes(u.role) && u.userId !== where.userId.not),
    },
  };
  return { db, prisma };
}

test('reminds lecturers and lab managers about items expiring within 30 days, and expired ones', async () => {
  const { db, prisma } = fakeDb([
    { consumableId: 1, name: 'LB Broth', expiryDate: day(12) },
    { consumableId: 2, name: 'Trypsin', expiryDate: day(-3) },
    { consumableId: 3, name: 'Agar', expiryDate: day(31) }, // too far away
    { consumableId: 4, name: 'Saline', expiryDate: null },
  ]);

  assert.equal(await sendExpiryReminders(prisma, NOW), 2);
  assert.deepEqual(
    db.notifications.map((n) => [n.userId, n.consumableId, n.notifType, n.message]),
    [
      [1, 1, 'reminder', 'LB Broth expires soon, on 27 Nov 2026'],
      [2, 1, 'reminder', 'LB Broth expires soon, on 27 Nov 2026'],
      [1, 2, 'reminder', 'Trypsin has expired (12 Nov 2026)'],
      [2, 2, 'reminder', 'Trypsin has expired (12 Nov 2026)'],
    ],
  );
});

test('an item exactly 30 days away is reminded', async () => {
  const { prisma } = fakeDb([{ consumableId: 1, name: 'PBS', expiryDate: day(30) }]);
  assert.equal(await sendExpiryReminders(prisma, NOW), 1);
});

test('runs again without repeating, but reminds again once the item expires or gets a new date', async () => {
  const item = { consumableId: 1, name: 'LB Broth', expiryDate: day(5) };
  const { db, prisma } = fakeDb([item]);

  await sendExpiryReminders(prisma, NOW);
  assert.equal(await sendExpiryReminders(prisma, NOW), 0);
  assert.equal(db.notifications.length, 2);

  // a week later it has expired: one new "has expired" reminder
  assert.equal(await sendExpiryReminders(prisma, new Date(NOW.getTime() + 7 * 86_400_000)), 1);

  // a new bottle with a new date inside the window: reminded again
  item.expiryDate = day(14);
  assert.equal(await sendExpiryReminders(prisma, NOW), 1);
  assert.equal(db.notifications.length, 6);
});
