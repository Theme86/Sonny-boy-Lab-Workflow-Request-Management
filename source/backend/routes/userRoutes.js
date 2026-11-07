// backend/routes/userRoutes.js
// /api/users: puts the three parts together — my profile (myProfileRoutes), user management for the Lab Manager
// (userManagementRoutes) and other people's profiles (below). Field lists and checks live in services/users/.
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireActiveUser } = require('../middleware/auth');
const { PUBLIC_FIELDS, ALL_FIELDS } = require('../services/users/fields');
const { httpError, parseUserId } = require('../services/users/validation');

// Every route below needs a logged-in, active user with an up-to-date role.
router.use(requireAuth, requireActiveUser);

// /me must come before /:id, so "me" is not read as an id
router.use(require('./myProfileRoutes'));
router.use(require('./myImageRoutes'));
router.use(require('./userManagementRoutes'));

// GET /api/users/:id — another user's profile (contact details only for yourself and the Lab Manager)
router.get('/:id', async (req, res) => {
  const userId = parseUserId(req.params.id);
  const canSeePrivate = userId === req.user.userId || req.user.role === 'lab_manager';
  const user = await prisma.user.findUnique({ where: { userId }, select: canSeePrivate ? ALL_FIELDS : PUBLIC_FIELDS });
  if (!user) throw httpError(404, 'User not found');
  res.json(user);
});

module.exports = router;
