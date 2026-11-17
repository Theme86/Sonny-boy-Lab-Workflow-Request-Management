// routes/notificationItemRoutes.js — one notification by id: read it, mark it read / unread, delete it.
// userId is in every where clause, so you can only touch your own rows.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");
const { include } = require("../utils/notificationInclude");

const router = Router();

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { notificationId: parseId(req.params.id), userId: req.user.userId },
      include,
    });
    if (!notification) throw new HttpError(404, "Not found");
    res.json(notification);
  })
);

module.exports = router;