const { Router } = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { requireRole } = require("../middleware/auth");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");

const router = Router();

// statuses that hold a room (same list the session routes use for the overlap check)
const BLOCKING = ["approved", "scheduled", "in_progress"];
const MAX_AVAILABILITY_DAYS = 31;

const roomSchema = z.object({
  name: z.string().trim().min(1).max(100), // room code, e.g. "201" (floor 2, room 01)
  capacity: z.number().int().positive().nullish(),
  location: z.string().trim().max(100).nullish(),
});

const availabilityQuery = z
  .object({ from: z.coerce.date(), to: z.coerce.date() })
  .refine((q) => q.to > q.from, { message: "to must be after from", path: ["to"] })
  .refine((q) => q.to - q.from <= MAX_AVAILABILITY_DAYS * 24 * 3600 * 1000, {
    message: `Range can be at most ${MAX_AVAILABILITY_DAYS} days`,
    path: ["to"],
  });

// two rooms can't share a code (the schema has no unique index, so check here)
async function assertNameFree(name, excludeId) {
  const clash = await prisma.labRoom.findFirst({
    where: { name, ...(excludeId ? { roomId: { not: excludeId } } : {}) },
    select: { roomId: true },
  });
  if (clash) throw new HttpError(409, `A room named "${name}" already exists`);
}

// ---------- read: any logged-in user ----------

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rooms = await prisma.labRoom.findMany({ orderBy: { name: "asc" } });
    res.json(rooms);
  })
);

// Which hours of a room are taken, for the booking grid.
// Returns only times, never who booked, so members can't see other people's sessions.
// Also includes the caller's own pending requests (flagged mine) so the grid can show them.
router.get(
  "/:id/availability",
  asyncHandler(async (req, res) => {
    const roomId = parseId(req.params.id);
    const q = availabilityQuery.parse(req.query);

    await prisma.labRoom.findUniqueOrThrow({ where: { roomId }, select: { roomId: true } });

    const sessions = await prisma.labSession.findMany({
      where: {
        roomId,
        requestedStart: { lt: q.to },
        requestedEnd: { gt: q.from },
        OR: [
          { status: { in: BLOCKING } },
          { status: "pending_approval", requestedBy: req.user.userId },
        ],
      },
      select: { requestedStart: true, requestedEnd: true, requestedBy: true, status: true },
      orderBy: { requestedStart: "asc" },
    });

    res.json(
      sessions.map((s) => ({
        start: s.requestedStart,
        end: s.requestedEnd,
        status: s.status,
        mine: s.requestedBy === req.user.userId,
      }))
    );
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const room = await prisma.labRoom.findUniqueOrThrow({
      where: { roomId: parseId(req.params.id) },
    });
    res.json(room);
  })
);

// ---------- write: lab managers only ----------

router.post(
  "/",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    const data = roomSchema.parse(req.body);
    await assertNameFree(data.name);
    res.status(201).json(await prisma.labRoom.create({ data }));
  })
);

router.patch(
  "/:id",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = roomSchema.partial().parse(req.body);
    if (data.name !== undefined) await assertNameFree(data.name, id);

    const room = await prisma.labRoom.update({ where: { roomId: id }, data });
    res.json(room);
  })
);

// Fails with 409 ("Record is referenced by other data") while sessions still use the room
router.delete(
  "/:id",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    await prisma.labRoom.delete({ where: { roomId: parseId(req.params.id) } });
    res.status(204).end();
  })
);

module.exports = router;