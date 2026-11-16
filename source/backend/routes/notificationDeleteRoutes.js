// routes/notificationDeleteRoutes.js — DELETE /api/notifications/:id: remove one of your own notifications.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");

const router = Router();

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.deleteMany({
      where: { notificationId: parseId(req.params.id), userId: req.user.userId },
    });
    if (result.count === 0) throw new HttpError(404, "Not found");
    res.status(204).end();
  })
);

module.exports = router;