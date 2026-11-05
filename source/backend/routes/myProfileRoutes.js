// backend/routes/myProfileRoutes.js — /api/users/me: read and edit my profile (pictures: myImageRoutes.js).
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { ALL_FIELDS } = require('../services/users/fields');
const { httpError } = require('../services/users/validation');
const { buildProfileData } = require('../services/users/profileData');
const { updateUser } = require('../services/users/routeHelpers');

// GET /api/users/me — my full profile
router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { userId: req.user.userId }, select: ALL_FIELDS });
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
    const current = await prisma.user.findUnique({ where: { userId: req.user.userId }, select: { profileCompletedAt: true } });
    if (!current?.profileCompletedAt) data.profileCompletedAt = new Date();
  }

  if (Object.keys(data).length === 0 && !markComplete) throw httpError(400, 'Nothing to update');
  res.json(await updateUser(req.user.userId, data));
});

module.exports = router;
