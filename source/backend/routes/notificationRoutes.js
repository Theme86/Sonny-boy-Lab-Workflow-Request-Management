const { Router } = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireRole } = require("../middleware/auth");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");

const router = Router();

const NOTIF_TYPES = ["status_change", "approval_needed", "new_comment", "reminder", "low_stock"];

// Small related info so the frontend can show a title and link to the target
const include = {
  request: { select: { requestId: true, title: true, status: true } },
  session: { select: { labSessionId: true, name: true, status: true } },
};

// ---------- validation ----------

const createSchema = z
  .object({
    userId: z.number().int().positive(),
    requestId: z.number().int().positive().nullish(),
    labSessionId: z.number().int().positive().nullish(),
    message: z.string().min(1).max(255),
    notifType: z.enum(NOTIF_TYPES).nullish(),
  })
  // DB rule: exactly one of request_id / lab_session_id
  .refine((d) => (d.requestId != null) !== (d.labSessionId != null), {
    message: "Provide exactly one of requestId or labSessionId",
    path: ["requestId"],
  });

const updateSchema = z.object({ isRead: z.boolean() });

const listQuery = z.object({
  isRead: z.enum(["true", "false"]).optional(),
  notifType: z.enum(NOTIF_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.coerce.number().int().positive().optional(), // cursor: notificationId
});

// ---------- routes ----------
// Every route works on the logged-in user's own notifications.
// (static paths like /unread-count are declared before /:id)

// List (newest first, cursor pagination)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);

    const rows = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
        isRead: q.isRead === undefined ? undefined : q.isRead === "true",
        notifType: q.notifType,
        notificationId: q.before ? { lt: q.before } : undefined,
      },
      include,
      orderBy: { notificationId: "desc" },
      take: q.limit + 1, // one extra row tells us if there is a next page
    });

    const hasMore = rows.length > q.limit;
    const items = hasMore ? rows.slice(0, q.limit) : rows;
    res.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].notificationId : null,
    });
  })
);

// Badge count
router.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const count = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false },
    });
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
    const result = await prisma.notification.deleteMany({
      where: { userId: req.user.userId, isRead: true },
    });
    res.json({ deleted: result.count });
  })
);

// Create: normally the system creates these, so only managers can do it by hand
router.post(
  "/",
  requireRole("lecturer", "lab_manager"),
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);

    // check targets exist so we return a clear 404 instead of an FK error
    const user = await prisma.user.findUnique({
      where: { userId: data.userId },
      select: { userId: true },
    });
    if (!user) throw new HttpError(404, "User not found");

    if (data.requestId != null) {
      const found = await prisma.request.findUnique({
        where: { requestId: data.requestId },
        select: { requestId: true },
      });
      if (!found) throw new HttpError(404, "Request not found");
    }
    if (data.labSessionId != null) {
      const found = await prisma.labSession.findUnique({
        where: { labSessionId: data.labSessionId },
        select: { labSessionId: true },
      });
      if (!found) throw new HttpError(404, "Lab session not found");
    }

    const notification = await prisma.notification.create({ data, include });
    res.status(201).json(notification);
  })
);

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

// Mark one as read / unread
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = updateSchema.parse(req.body);

    // userId in the where clause = you can only touch your own rows
    const result = await prisma.notification.updateMany({
      where: { notificationId: id, userId: req.user.userId },
      data,
    });
    if (result.count === 0) throw new HttpError(404, "Not found");

    res.json(await prisma.notification.findUnique({ where: { notificationId: id }, include }));
  })
);

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
