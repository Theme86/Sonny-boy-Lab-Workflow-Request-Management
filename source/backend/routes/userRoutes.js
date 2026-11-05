// backend/routes/userRoutes.js
// /api/users: my profile (read, edit, picture, banner), user management for the Lab Manager, and other people's profiles.
// Field lists, input checks and the list query live in services/users/.
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole, requireActiveUser } = require('../middleware/auth');
const { saveUserImage } = require('../utils/saveUserImage');
const { assignDefaultBanner } = require('../utils/assignDefaultBanner');
const { ROLES, PUBLIC_FIELDS, ALL_FIELDS } = require('../services/users/fields');
const { httpError, parseUserId } = require('../services/users/validation');
const { buildProfileData } = require('../services/users/profileData');
const { parseListQuery } = require('../services/users/userList');

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BANNER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Every route below needs a logged-in, active user with an up-to-date role.
router.use(requireAuth, requireActiveUser);

// Accepts the raw image bytes as the request body (Content-Type: image/jpeg|png|webp)
function rawImage(maxBytes) {
  return express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: maxBytes });
}

function requireImageBody(req) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }
}

const updateUser = (userId, data) => prisma.user.update({ where: { userId }, data, select: ALL_FIELDS });

async function requireUserExists(userId) {
  const exists = await prisma.user.findUnique({ where: { userId }, select: { userId: true } });
  if (!exists) throw httpError(404, 'User not found');
}

// ============================================
// MY PROFILE
// ============================================

// GET /api/users/me — my full profile
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { userId: req.user.userId },
    select: ALL_FIELDS,
  });
  if (!user) throw httpError(404, 'User not found');
  res.json(user);
});

// PATCH /api/users/me — create/edit my profile
// body: { firstName?, lastName?, studentId?, phone?, department?, bio?, markProfileComplete? }
// Send "" or null to clear an optional field.
// markProfileComplete: true is sent by the "create profile" page; it records when setup finished.
router.patch('/me', async (req, res) => {
  const body = req.body ?? {};
  const data = buildProfileData(body);
  const markComplete = body.markProfileComplete === true;

  if (markComplete) {
    const current = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { profileCompletedAt: true },
    });
    if (!current?.profileCompletedAt) data.profileCompletedAt = new Date();
  }

  if (Object.keys(data).length === 0 && !markComplete) throw httpError(400, 'Nothing to update');

  res.json(await updateUser(req.user.userId, data));
});

// PUT /api/users/me/avatar — upload a new profile picture (max 2 MB)
router.put('/me/avatar', rawImage(AVATAR_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const avatarUrl = saveUserImage(req.user.userId, 'avatar', req.body);
  res.json(await updateUser(req.user.userId, { avatarUrl }));
});

// PUT /api/users/me/banner — upload a new banner (max 5 MB)
router.put('/me/banner', rawImage(BANNER_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const bannerUrl = saveUserImage(req.user.userId, 'banner', req.body);
  res.json(await updateUser(req.user.userId, { bannerUrl }));
});

// DELETE /api/users/me/banner — go back to the default banner
router.delete('/me/banner', async (req, res) => {
  const path = assignDefaultBanner(req.user.userId);
  if (!path) throw httpError(500, 'Could not restore the default banner');
  res.json(await updateUser(req.user.userId, { bannerUrl: `${path}?v=${Date.now()}` }));
});

// ============================================
// USER MANAGEMENT (Lab Manager only) — US-09
// ============================================

// GET /api/users?q=&role=&status=active|inactive|all&sort=createdAt|lastLoginAt|email|role|name&order=asc|desc&page=1&pageSize=20
router.get('/', requireRole('lab_manager'), async (req, res) => {
  const { where, orderBy, page, pageSize } = parseListQuery(req.query);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: ALL_FIELDS }),
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

  await requireUserExists(userId);
  res.json(await updateUser(userId, { role }));
});

// PATCH /api/users/:id/active — body: { active: true|false }
router.patch('/:id/active', requireRole('lab_manager'), async (req, res) => {
  const userId = parseUserId(req.params.id);
  const active = req.body?.active;

  if (typeof active !== 'boolean') throw httpError(400, 'active must be true or false');
  if (userId === req.user.userId) throw httpError(400, 'You cannot deactivate your own account');

  await requireUserExists(userId);
  res.json(await updateUser(userId, { active }));
});

// ============================================
// VIEW ANOTHER USER'S PROFILE
// ============================================

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  const userId = parseUserId(req.params.id);
  const canSeePrivate = userId === req.user.userId || req.user.role === 'lab_manager';
  const user = await prisma.user.findUnique({
    where: { userId },
    select: canSeePrivate ? ALL_FIELDS : PUBLIC_FIELDS,
  });
  if (!user) throw httpError(404, 'User not found');
  res.json(user);
});

module.exports = router;
