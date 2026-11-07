// routes/dashboardRoutes.js — GET /api/dashboard: everything the home page shows, in one request.
// What is included depends on the person's role (see services/dashboard/access.js).
const express = require('express');
const { z } = require('zod');
const { prisma } = require('../lib/prisma');
const { requireAuth, requireActiveUser } = require('../middleware/auth');
const { buildDashboard } = require('../services/dashboard');

const router = express.Router();

const MAX_WINDOW_MS = 48 * 60 * 60 * 1000;

// The room timeline covers from..to. The browser sends its own "today", so the day starts at local midnight.
const windowQuery = z
  .object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() })
  .refine((q) => !q.from === !q.to, { message: 'Send both from and to, or neither', path: ['to'] })
  .refine((q) => !q.from || q.to > q.from, { message: 'to must be after from', path: ['to'] })
  .refine((q) => !q.from || q.to - q.from <= MAX_WINDOW_MS, { message: 'The window can be at most 48 hours', path: ['to'] });

// requireActiveUser re-reads the role from the database, so a role change or a disabled account applies at once
router.get('/', requireAuth, requireActiveUser, async (req, res) => {
  const parsed = windowQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  }
  res.json(await buildDashboard(prisma, req.user, parsed.data));
});

module.exports = router;
