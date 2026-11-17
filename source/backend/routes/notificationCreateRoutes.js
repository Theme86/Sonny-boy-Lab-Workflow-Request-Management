// routes/notificationCreateRoutes.js — POST /api/notifications: create by hand.
// Normally the system creates these, so only lecturers and lab managers can do it.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { requireRole } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/helpers");
const { include } = require("../utils/notificationInclude");
const { createSchema } = require("../utils/notificationSchemas");
const { assertTargetsExist } = require("../utils/notificationTargets");

const router = Router();

router.post(
  "/",
  requireRole("lecturer", "lab_manager"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    await assertTargetsExist(data, req.user);
    const notification = await prisma.notification.create({ data, include });
    res.status(201).json(notification);
  })
);

module.exports = router;