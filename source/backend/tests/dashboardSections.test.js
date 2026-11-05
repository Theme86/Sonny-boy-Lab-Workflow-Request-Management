const test = require('node:test');
const assert = require('node:assert/strict');
const { makeFakePrisma } = require('./support/fakeDashboardPrisma');
const { myWork } = require('../services/dashboard/myWork');
const { consumableSummary, equipmentSummary } = require('../services/dashboard/inventory');
const { attention } = require('../services/dashboard/attention');
const { roomSummary, groupBusyByRoom, isBusyAt } = require('../services/dashboard/rooms');

const NOW = new Date('2026-11-05T12:00:00Z');
const at = (hours) => new Date(NOW.getTime() + hours * 3600000);
const ME = { userId: 7, role: 'member' };

test('myWork only asks for this user\'s own data', async () => {
  const { prisma, callsTo } = makeFakePrisma({
    session: { labSessionId: 1, name: 'Optics', status: 'approved', requestedStart: at(2), requestedEnd: at(4), room: { roomId: 3, name: 'B1' } },
    requestGroups: [{ status: 'open', _count: { _all: 2 } }, { status: 'completed', _count: { _all: 5 } }],
    notificationCount: 3,
    notifications: [{ notificationId: 9, message: 'Approved' }],
  });
  const result = await myWork(prisma, ME, NOW);

  assert.equal(callsTo('request.groupBy')[0].args.where.requesterId, 7);
  assert.deepEqual(callsTo('notification.count')[0].args.where, { userId: 7, isRead: false });
  const sessionWhere = callsTo('labSession.findFirst')[0].args.where;
  assert.deepEqual(sessionWhere.OR, [{ requestedBy: 7 }, { participants: { some: { userId: 7 } } }]);
  assert.equal(sessionWhere.archived, false);
  assert.deepEqual(sessionWhere.requestedEnd, { gt: NOW });

  assert.equal(result.requests.counts.open, 2);
  assert.equal(result.requests.active, 2);
  assert.equal(result.notifications.unread, 3);
  assert.equal(result.nextSession.name, 'Optics');
  assert.deepEqual(result.nextSession.start, at(2));
  assert.equal('requestedStart' in result.nextSession, false);
});

test('myWork returns nextSession null when there is none', async () => {
  const { prisma } = makeFakePrisma();
  const result = await myWork(prisma, ME, NOW);
  assert.equal(result.nextSession, null);
  assert.equal(result.requests.active, 0);
});

const consumable = (over) => ({
  consumableId: 1, name: 'Ethanol', unit: 'L', currentStock: '10', reorderThreshold: '2', expiryDate: null, hazards: [], ...over,
});

test('consumableSummary finds low stock and expiry, with hazards and numbers', async () => {
  const { prisma } = makeFakePrisma({
    consumables: [
      consumable({ consumableId: 1, name: 'Fine' }),
      consumable({ consumableId: 2, name: 'Acid', currentStock: '1', reorderThreshold: '4', hazards: [{ hazard: { name: 'Corrosive' } }] }),
      consumable({ consumableId: 3, name: 'Empty', currentStock: '0', reorderThreshold: '4' }),
      consumable({ consumableId: 4, name: 'Old', expiryDate: at(-48) }),
      consumable({ consumableId: 5, name: 'Soon', expiryDate: at(24 * 10) }),
      consumable({ consumableId: 6, name: 'Far', expiryDate: at(24 * 200) }),
    ],
  });
  const result = await consumableSummary(prisma, NOW);

  assert.equal(result.total, 6);
  assert.deepEqual(result.lowStock.items.map((i) => i.name), ['Empty', 'Acid']);
  assert.equal(result.lowStock.items[1].currentStock, 1);
  assert.deepEqual(result.lowStock.items[1].hazards, ['Corrosive']);
  assert.deepEqual(result.expiring.items.map((i) => [i.name, i.expiry]), [['Old', 'expired'], ['Soon', 'soon']]);
});

test('consumableSummary caps long lists but reports the true total', async () => {
  const many = Array.from({ length: 9 }, (_, i) => consumable({ consumableId: i, name: `C${i}`, currentStock: '0', reorderThreshold: '1' }));
  const { prisma } = makeFakePrisma({ consumables: many });
  const result = await consumableSummary(prisma, NOW);
  assert.equal(result.lowStock.total, 9);
  assert.equal(result.lowStock.items.length, 6);
});

test('equipmentSummary adds up units and lists kinds that are all taken', async () => {
  const { prisma } = makeFakePrisma({
    equipment: [
      { equipmentId: 1, name: 'Scope', quantityAvailable: 2, quantityTotal: 4 },
      { equipmentId: 2, name: 'Laser', quantityAvailable: 0, quantityTotal: 1 },
      { equipmentId: 3, name: 'Retired', quantityAvailable: 0, quantityTotal: 0 },
    ],
  });
  const result = await equipmentSummary(prisma);
  assert.equal(result.kinds, 3);
  assert.equal(result.unitsAvailable, 2);
  assert.equal(result.unitsTotal, 5);
  assert.deepEqual(result.allTaken.items.map((e) => e.name), ['Laser']);
});

test('attention returns null for a member and never queries', async () => {
  const { prisma, calls } = makeFakePrisma();
  assert.equal(await attention(prisma, ME, NOW), null);
  assert.equal(calls.length, 0);
});

test('attention for a TA has requests only and does not count sessions or members', async () => {
  const { prisma, callsTo } = makeFakePrisma({
    requestCount: 4,
    maintenance: [
      { equipmentId: 1, equipment: { name: 'Scope' } },
      { equipmentId: 1, equipment: { name: 'Scope' } },
    ],
  });
  const result = await attention(prisma, { userId: 2, role: 'ta' }, NOW);
  assert.deepEqual(Object.keys(result), ['requests']);
  assert.deepEqual(result.requests.underMaintenance, [{ equipmentId: 1, name: 'Scope' }]);
  assert.equal(callsTo('labSession.count').length, 0);
  assert.equal(callsTo('user.count').length, 0);
  assert.equal(callsTo('request.count').find((c) => c.args.where.assignedTo === 2).args.where.assignedTo, 2);
});

test('attention for a lecturer adds pending sessions but not new members', async () => {
  const { prisma, callsTo } = makeFakePrisma({ pendingSessions: 2 });
  const result = await attention(prisma, { userId: 3, role: 'lecturer' }, NOW);
  assert.equal(result.pendingSessions, 2);
  assert.equal('newMembers' in result, false);
  assert.equal(callsTo('user.count').length, 0);
});

test('attention for a lab manager includes everything, new members from the last 7 days', async () => {
  const { prisma, callsTo } = makeFakePrisma({ pendingSessions: 1, newMembers: 5 });
  const result = await attention(prisma, { userId: 1, role: 'lab_manager' }, NOW);
  assert.equal(result.newMembers, 5);
  assert.equal(result.pendingSessions, 1);
  const where = callsTo('user.count')[0].args.where;
  assert.deepEqual(where.createdAt.gte, new Date(NOW.getTime() - 7 * 86400000));
  assert.equal(where.role, 'member');
});

test('groupBusyByRoom and isBusyAt', () => {
  const busy = groupBusyByRoom([
    { roomId: 1, requestedStart: at(1), requestedEnd: at(2) },
    { roomId: 1, requestedStart: at(5), requestedEnd: at(6) },
  ]);
  assert.equal(busy.get(1).length, 2);
  assert.equal(isBusyAt(busy.get(1), at(1)), true);
  assert.equal(isBusyAt(busy.get(1), at(2)), false);
});

test('roomSummary returns times only, only blocking statuses, and marks rooms in use', async () => {
  const { prisma, callsTo } = makeFakePrisma({
    rooms: [{ roomId: 1, name: 'A' }, { roomId: 2, name: 'B' }],
    busySessions: [{ roomId: 1, requestedStart: at(-1), requestedEnd: at(1) }],
  });
  const result = await roomSummary(prisma, { from: NOW, to: at(24) }, NOW);

  const where = callsTo('labSession.findMany')[0].args.where;
  assert.deepEqual(where.status.in, ['approved', 'scheduled', 'in_progress']);
  assert.deepEqual(callsTo('labSession.findMany')[0].args.select, { roomId: true, requestedStart: true, requestedEnd: true });
  assert.equal(result.rooms[0].inUseNow, true);
  assert.equal(result.rooms[1].inUseNow, false);
  assert.deepEqual(Object.keys(result.rooms[0].busy[0]), ['start', 'end']);
});
