const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const {
  validateRequestInput,
  REQUEST_TYPES,
  REQUEST_STATUSES,
} = require('../utils/validateRequest');

// Roles that can see everyone's requests. Plain members only see their own.
// (Fine-grained rules belong to US-08 Restricted Visibility.)
const STAFF_ROLES = ['ta', 'lecturer', 'lab_manager'];
const isStaff = (role) => STAFF_ROLES.includes(role);

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

// POST /api/requests  -> submit a new request
router.post('/', requireAuth, async (req, res) => {
  const { ok, errors, data } = validateRequestInput(req.body);
  if (!ok) return res.status(400).json({ error: 'Validation failed', details: errors });

  if (data.equipmentId) {
    const equipment = await prisma.equipment.findUnique({
      where: { equipmentId: data.equipmentId },
      select: { equipmentId: true },
    });
    if (!equipment) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { equipmentId: 'Equipment not found' },
      });
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

  res.status(201).json({ request: created });
});

// GET /api/requests?status=&type=&mine=true&page=1&limit=20
router.get('/', requireAuth, async (req, res) => {
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

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ error: 'Invalid request id' });
  }

  const request = await prisma.request.findUnique({ where: { requestId }, include: detailInclude });
  if (!request) return res.status(404).json({ error: 'Request not found' });

  if (request.requesterId !== req.user.userId && !isStaff(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({ request });
});

module.exports = router;
