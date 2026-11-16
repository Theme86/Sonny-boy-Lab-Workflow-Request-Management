// routes/notificationListRoutes.js — GET /api/notifications: the logged-in user's list, newest first, cursor paging.
const { Router } = require("express");
const { prisma } = require("../lib/prisma");
const { asyncHandler } = require("../middleware/helpers");
const { include } = require("../utils/notificationInclude");
const { listWhere, toPage } = require("../utils/notificationPaging");
const { listQuery } = require("../utils/notificationSchemas");

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const rows = await prisma.notification.findMany({
      where: listWhere(req.user.userId, q),
      include,
      orderBy: { notificationId: "desc" },
      take: q.limit + 1, // one extra row tells us if there is a next page
    });
    res.json(toPage(rows, q.limit));
  })
);

module.exports = router;