// backend/routes/userManagementRoutes.js — user management for the Lab Manager only (US-09).
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireRole } = require('../middleware/auth');
const { ROLES, ALL_FIELDS } = require('../services/users/fields');
const { httpError, parseUserId } = require('../services/users/validation');
const { parseListQuery } = require('../services/users/userList');
const { updateUser, requireUserExists } = require('../services/users/routeHelpers');

const managerOnly = requireRole('lab_manager');

// GET /api/users?q=&role=&status=active|inactive|all&sort=createdAt|lastLoginAt|email|role|name&order=asc|desc&page=1&pageSize=20
router.get('/', managerOnly, async (req, res) => {
  const { where, orderBy, page, pageSize } = parseListQuery(req.query);

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize, select: ALL_FIELDS }),
  ]);

  res.json({ users, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
});

// PATCH /api/users/:id/role — body: { role }
router.patch('/:id/role', managerOnly, async (req, res) => {
  const userId = parseUserId(req.params.id);
  const role = req.body?.role;

  if (!ROLES.includes(role)) throw httpError(400, `role must be one of: ${ROLES.join(', ')}`);
  // prevents a lab manager from accidentally locking everyone out of user management
  if (userId === req.user.userId) throw httpError(400, 'You cannot change your own role');

  await requireUserExists(userId);
  res.json(await updateUser(userId, { role }));
});

// PATCH /api/users/:id/active — body: { active: true|false }
router.patch('/:id/active', managerOnly, async (req, res) => {
  const userId = parseUserId(req.params.id);
  const active = req.body?.active;

  if (typeof active !== 'boolean') throw httpError(400, 'active must be true or false');
  if (userId === req.user.userId) throw httpError(400, 'You cannot deactivate your own account');

  await requireUserExists(userId);
  res.json(await updateUser(userId, { active }));
});

module.exports = router;
