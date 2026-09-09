// backend/routes/userRoute.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }

  const user = await prisma.users.findUnique({
    where: { userId },
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      active: true,
      // googleId intentionally excluded — no reason to expose it to clients
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

module.exports = router;