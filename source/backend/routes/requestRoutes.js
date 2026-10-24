const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireActiveUser } = require('../middleware/auth');
const { validateRequestInput, REQUEST_TYPES, REQUEST_STATUSES } = require('../utils/validateRequest');
const {
  STAFF_ROLES,
  isStaff,
  canTransition,
  allowedStatusesFor,
  nextStatuses,
  humanize,
} = require('../utils/requestStatus');

// requireActiveUser re-reads the role from the database, so a role change
// (or a disabled account) applies immediately instead of when the login token expires.
const auth = [requireAuth, requireActiveUser];

const userSelect = { userId: true, firstName: true, lastName: true, email: true };

const listInclude = {
  requester: { select: userSelect },
  assignee: { select: userSelect },
  equipment: { select: { equipmentId: true, name: true } },
};

const detailInclude = {
  ...listInclude,
  accessDetail: true,
  reservationDetail: true,
  consumableOrderItems: {
    include: { consumable: { select: { consumableId: true, name: true, unit: true } } },
  },
  statusHistory: {
    orderBy: { changedAt: 'asc' },
    include: { changer: { select: userSelect } },
  },
};

const parseId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const staffOnly = (req, res, message) => {
  if (isStaff(req.user.role)) return false;
  res.status(403).json({ error: message });
  return true;
};

// POST /api/requests  -> submit a new request
router.post('/', ...auth, async (req, res) => {
  const { ok, errors, data } = validateRequestInput(req.body);
  if (!ok) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (data.equipmentId) {
    const equipment = await prisma.equipment.findUnique({
      where: { equipmentId: data.equipmentId },
      select: { equipmentId: true },
    });
    if (!equipment) {
      return res.status(400).json({ error: 'Validation failed', details: { equipmentId: 'Equipment not found' } });
    }
  }

  const userId = req.user.userId;

  // Request + first status-history row must succeed or fail together
  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.request.create({
      data: {
        requesterId: userId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        equipmentId: data.equipmentId,
        ...(data.access && { accessDetail: { create: data.access } }),
      },
      include: detailInclude,
    });

    await tx.requestStatusHistory.create({
      data: { requestId: request.requestId, oldStatus: null, newStatus: 'open', changedBy: userId },
    });

    return request;
  });

  res.status(201).json({ request: created, allowedStatuses: allowedStatusesFor(created.status, req.user.role) });
});

// GET /api/requests?status=&type=&mine=true&page=1&limit=20
router.get('/', ...auth, async (req, res) => {
  const { status, type, mine } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const where = {};
  if (!isStaff(req.user.role) || mine === 'true') where.requesterId = req.user.userId;

  if (status !== undefined && status !== '') {
    if (!REQUEST_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status filter' });
    where.status = status;
  }
  if (type !== undefined && type !== '') {
    if (!REQUEST_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid type filter' });
    where.type = type;
  }

  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: listInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.request.count({ where }),
  ]);

  res.json({ items, total, page, limit });
});

// GET /api/requests/assignees  -> people a request can be assigned to (staff only)
// (declared before /:id so "assignees" is not read as an id)
router.get('/assignees', ...auth, async (req, res) => {
  if (staffOnly(req, res, 'Only lab staff can see who a request can be assigned to')) return;

  const assignees = await prisma.user.findMany({
    where: { active: true, role: { in: STAFF_ROLES } },
    select: { userId: true, firstName: true, lastName: true, role: true },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  });
  res.json({ assignees });
});

// GET /api/requests/:id   (allowedStatuses = what this person can change it to right now)
router.get('/:id', ...auth, async (req, res) => {
  const requestId = parseId(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Invalid request id' });

  const request = await prisma.request.findUnique({ where: { requestId }, include: detailInclude });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  if (request.requesterId !== req.user.userId && !isStaff(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ request, allowedStatuses: allowedStatusesFor(request.status, req.user.role) });
});

// PATCH /api/requests/:id/status   body: { status }
// Staff only. The move must be allowed by STATUS_FLOW. Writes a history row.
router.patch('/:id/status', ...auth, async (req, res) => {
  if (staffOnly(req, res, 'Only lab staff can change the status of a request')) return;

  const requestId = parseId(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Invalid request id' });

  const next = req.body?.status;
  if (typeof next !== 'string' || !REQUEST_STATUSES.includes(next)) {
    return res.status(400).json({ error: 'Validation failed', details: { status: 'Choose a valid status' } });
  }

  const current = await prisma.request.findUnique({
    where: { requestId },
    select: { requestId: true, status: true },
  });
  if (!current) return res.status(404).json({ error: 'Request not found' });

  if (!canTransition(current.status, next)) {
    return res.status(409).json({
      error: `A request that is ${humanize(current.status)} cannot move to ${humanize(next)}`,
      allowedStatuses: nextStatuses(current.status),
    });
  }

  const updated = await prisma.$transaction(async (tx) => {
    // `status: current.status` makes sure nobody else changed it since we read it
    const { count } = await tx.request.updateMany({
      where: { requestId, status: current.status },
      data: { status: next, closedAt: next === 'closed' ? new Date() : null },
    });
    if (count === 0) return null;

    await tx.requestStatusHistory.create({
      data: { requestId, oldStatus: current.status, newStatus: next, changedBy: req.user.userId },
    });
    return tx.request.findUnique({ where: { requestId }, include: detailInclude });
  });

  if (!updated) {
    return res.status(409).json({ error: 'Someone else just changed this request. Reload the page and try again.' });
  }
  res.json({ request: updated, allowedStatuses: allowedStatusesFor(updated.status, req.user.role) });
});

// PATCH /api/requests/:id/assignee   body: { assigneeId: number | null }
// Staff only. Assigning an "open" request also moves it to "in_review" (triage).
router.patch('/:id/assignee', ...auth, async (req, res) => {
  if (staffOnly(req, res, 'Only lab staff can assign a request')) return;

  const requestId = parseId(req.params.id);
  if (!requestId) return res.status(400).json({ error: 'Invalid request id' });

  const body = req.body ?? {};
  if (!('assigneeId' in body)) {
    return res.status(400).json({ error: 'Validation failed', details: { assigneeId: 'Choose a person or leave unassigned' } });
  }
  const assigneeId = body.assigneeId === null ? null : parseId(body.assigneeId);
  if (body.assigneeId !== null && !assigneeId) {
    return res.status(400).json({ error: 'Validation failed', details: { assigneeId: 'Choose a valid person' } });
  }

  const current = await prisma.request.findUnique({
    where: { requestId },
    select: { requestId: true, status: true },
  });
  if (!current) return res.status(404).json({ error: 'Request not found' });
  if (current.status === 'closed') {
    return res.status(409).json({ error: 'A closed request cannot be reassigned' });
  }

  if (assigneeId !== null) {
    const person = await prisma.user.findUnique({
      where: { userId: assigneeId },
      select: { userId: true, role: true, active: true },
    });
    if (!person || !person.active || !isStaff(person.role)) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { assigneeId: 'Choose an active TA, lecturer or lab manager' },
      });
    }
  }

  const startReview = assigneeId !== null && current.status === 'open';

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.request.updateMany({
      where: { requestId, status: current.status },
      data: { assignedTo: assigneeId, ...(startReview && { status: 'in_review' }) },
    });
    if (count === 0) return null;

    if (startReview) {
      await tx.requestStatusHistory.create({
        data: { requestId, oldStatus: 'open', newStatus: 'in_review', changedBy: req.user.userId },
      });
    }
    return tx.request.findUnique({ where: { requestId }, include: detailInclude });
  });

  if (!updated) {
    return res.status(409).json({ error: 'Someone else just changed this request. Reload the page and try again.' });
  }
  res.json({ request: updated, allowedStatuses: allowedStatusesFor(updated.status, req.user.role) });
});

module.exports = router;
