// routes/notificationBulkRoutes.js — the fixed paths that work on all of the user's notifications at once.
// They are mounted before /:id so "read-all" and "read" are never taken for an id.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler } = require("../middleware/helpers");

const router = Router();

// Badge count
router.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({ where: { userId: req.user.userId, isRead: false } });
    res.json({ count });
  })
);

// Mark all as read
router.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ updated: result.count });
  })
);

// Clear all read notifications
router.delete(
  "/read",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.deleteMany({ where: { userId: req.user.userId, isRead: true } });
    res.json({ deleted: result.count });
  })
);

module.exports = router;