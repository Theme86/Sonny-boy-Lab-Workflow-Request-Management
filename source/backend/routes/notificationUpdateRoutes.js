// routes/notificationUpdateRoutes.js — PATCH /api/notifications/:id: mark one as read / unread.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");
const { include } = require("../utils/notificationInclude");
const { updateSchema } = require("../utils/notificationSchemas");

const router = Router();

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = updateSchema.parse(req.body);
    const result = await prisma.notification.updateMany({ where: { notificationId: id, userId: req.user.userId }, data });
    if (result.count === 0) throw new HttpError(404, "Not found");
    res.json(await prisma.notification.findUnique({ where: { notificationId: id }, include }));
  })
);

module.exports = router;