// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole, requireActiveUser } = require('../middleware/auth');
const { saveUserImage } = require('../utils/saveUserImage');
const { assignDefaultBanner } = require('../utils/assignDefaultBanner');

const ROLES = ['member', 'ta', 'lecturer', 'lab_manager'];
const NAME_MAX = 100;
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BANNER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Fields any logged-in user may see about another user.
// googleId is intentionally excluded — no reason to expose it to clients.
const PUBLIC_FIELDS = {
  userId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  avatarUrl: true,
  bannerUrl: true,
  createdAt: true,
  lastLoginAt: true,
  active: true,
};

// Every route below needs a logged-in, active user with an up-to-date role.
router.use(requireAuth, requireActiveUser);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseUserId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'Invalid user id');
  return id;
}

function cleanName(value, label) {
  if (typeof value !== 'string') throw httpError(400, `${label} must be text`);
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw httpError(400, `${label} is required`);
  if (trimmed.length > NAME_MAX) throw httpError(400, `${label} must be at most ${NAME_MAX} characters`);
  return trimmed;
}

// Accepts the raw image bytes as the request body (Content-Type: image/jpeg|png|webp)
function rawImage(maxBytes) {
  return express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: maxBytes });
}

function requireImageBody(req) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }
}

// ============================================
// MY PROFILE
// ============================================

// GET /api/users/me — my full profile
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { userId: req.user.userId },
    select: PUBLIC_FIELDS,
  });
  if (!user) throw httpError(404, 'User not found');
  res.json(user);
});

// PATCH /api/users/me — edit my name
// body: { firstName?, lastName? }
router.patch('/me', async (req, res) => {
  const body = req.body ?? {};
  const data = {};
  if (body.firstName !== undefined) data.firstName = cleanName(body.firstName, 'First name');
  if (body.lastName !== undefined) data.lastName = cleanName(body.lastName, 'Last name');

  if (Object.keys(data).length === 0) {
    throw httpError(400, 'Nothing to update. Send firstName and/or lastName');
  }

  const user = await prisma.user.update({
    where: { userId: req.user.userId },
    data,
    select: PUBLIC_FIELDS,
  });
  res.json(user);
});

// PUT /api/users/me/avatar — upload a new profile picture (max 2 MB)
router.put('/me/avatar', rawImage(AVATAR_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const avatarUrl = saveUserImage(req.user.userId, 'avatar', req.body);
  const user = await prisma.user.update({
    where: { userId: req.user.userId },
    data: { avatarUrl },
    select: PUBLIC_FIELDS,
  });
  res.json(user);
});

// PUT /api/users/me/banner — upload a new banner (max 5 MB)
router.put('/me/banner', rawImage(BANNER_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const bannerUrl = saveUserImage(req.user.userId, 'banner', req.body);
  const user = await prisma.user.update({
    where: { userId: req.user.userId },
    data: { bannerUrl },
    select: PUBLIC_FIELDS,
  });
  res.json(user);
});

// DELETE /api/users/me/banner — go back to the default banner
router.delete('/me/banner', async (req, res) => {
  const path = assignDefaultBanner(req.user.userId);
  if (!path) throw httpError(500, 'Could not restore the default banner');
  const user = await prisma.user.update({
    where: { userId: req.user.userId },
    data: { bannerUrl: `${path}?v=${Date.now()}` },
    select: PUBLIC_FIELDS,
  });
  res.json(user);
});

// ============================================
// USER MANAGEMENT (Lab Manager only) — US-09
// ============================================

const SORT_FIELDS = {
  createdAt: 'createdAt',
  lastLoginAt: 'lastLoginAt',
  email: 'email',
  role: 'role',
  name: 'firstName',
};

// GET /api/users?q=&role=&status=active|inactive|all&sort=createdAt|lastLoginAt|email|role|name&order=asc|desc&page=1&pageSize=20
router.get('/', requireRole('lab_manager'), async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role : '';
  const status = typeof req.query.status === 'string' ? req.query.status : 'all';
  const sortKey = SORT_FIELDS[req.query.sort] ?? 'createdAt';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));

  if (role && !ROLES.includes(role)) throw httpError(400, `role must be one of: ${ROLES.join(', ')}`);

  const where = {};
  if (role) where.role = role;
  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;
  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const orderBy = [{ [sortKey]: order }];
  if (sortKey === 'firstName') orderBy.push({ lastName: order });
  orderBy.push({ userId: 'asc' }); // stable order between pages

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: PUBLIC_FIELDS,
    }),
  ]);

  res.json({ users, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

// PATCH /api/users/:id/role — body: { role }
router.patch('/:id/role', requireRole('lab_manager'), async (req, res) => {
  const userId = parseUserId(req.params.id);
  const role = req.body?.role;

  if (!ROLES.includes(role)) throw httpError(400, `role must be one of: ${ROLES.join(', ')}`);
  // prevents a lab manager from accidentally locking everyone out of user management
  if (userId === req.user.userId) throw httpError(400, 'You cannot change your own role');

  const exists = await prisma.user.findUnique({ where: { userId }, select: { userId: true } });
  if (!exists) throw httpError(404, 'User not found');

  const user = await prisma.user.update({ where: { userId }, data: { role }, select: PUBLIC_FIELDS });
  res.json(user);
});

// PATCH /api/users/:id/active — body: { active: true|false }
router.patch('/:id/active', requireRole('lab_manager'), async (req, res) => {
  const userId = parseUserId(req.params.id);
  const active = req.body?.active;

  if (typeof active !== 'boolean') throw httpError(400, 'active must be true or false');
  if (userId === req.user.userId) throw httpError(400, 'You cannot deactivate your own account');

  const exists = await prisma.user.findUnique({ where: { userId }, select: { userId: true } });
  if (!exists) throw httpError(404, 'User not found');

  const user = await prisma.user.update({ where: { userId }, data: { active }, select: PUBLIC_FIELDS });
  res.json(user);
});

// ============================================
// VIEW ANOTHER USER'S PROFILE
// ============================================

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const userId = parseUserId(req.params.id);
  const user = await prisma.user.findUnique({ where: { userId }, select: PUBLIC_FIELDS });
  if (!user) throw httpError(404, 'User not found');
  res.json(user);
});

module.exports = router;
