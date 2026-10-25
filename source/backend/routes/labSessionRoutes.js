const crypto = require("crypto");
const { Router } = require("express");
const { z } = require("zod");
const { prisma } = require("../lib/prisma");
const { asyncHandler, HttpError, parseId } = require("../middleware/helpers");

const router = Router();

const MANAGER_ROLES = ["lecturer", "lab_manager"];
const BLOCKING = ["approved", "scheduled", "in_progress"]; // statuses that hold the room
const ARCHIVABLE = ["completed", "cancelled", "rejected"];

const TRANSITIONS = {
  pending_approval: ["approved", "rejected", "cancelled"],
  approved: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

const SESSION_STATUSES = Object.keys(TRANSITIONS); // must stay below TRANSITIONS

const isManager = (user) => MANAGER_ROLES.includes(user.role);

const personSelect = { userId: true, firstName: true, lastName: true };

// ---------- validation ----------

const baseSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(250).nullish(),
  projectId: z.number().int().positive().nullish(),
  roomId: z.number().int().positive(),
  requestedStart: z.coerce.date(),
  requestedEnd: z.coerce.date(),
});

const createSchema = baseSchema.refine((d) => d.requestedEnd > d.requestedStart, {
  message: "requestedEnd must be after requestedStart",
  path: ["requestedEnd"],
});

const updateSchema = baseSchema.partial();

const listQuery = z.object({
  status: z.enum(SESSION_STATUSES).optional(),
  roomId: z.coerce.number().int().optional(),
  archived: z.enum(["true", "false"]).default("false"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ---------- helpers ----------

// Locks the room row so concurrent requests for the same room queue up,
// then rejects the booking if it overlaps a session that holds the room.
async function assertNoOverlap(tx, roomId, start, end, excludeId) {
  const locked = await tx.$queryRaw`
    SELECT room_id FROM lab_rooms WHERE room_id = ${roomId} FOR UPDATE`;
  if (locked.length === 0) throw new HttpError(404, "Room not found");

  const clash = await tx.labSession.findFirst({
    where: {
      roomId,
      status: { in: BLOCKING },
      requestedStart: { lt: end },
      requestedEnd: { gt: start },
      ...(excludeId ? { labSessionId: { not: excludeId } } : {}),
    },
    select: { labSessionId: true },
  });
  if (clash) {
    throw new HttpError(409, `Room is already booked for that time (session #${clash.labSessionId})`);
  }
}

// ---------- routes ----------

// Create: requester = logged-in user, status starts as pending_approval
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const session = await prisma.$transaction(async (tx) => {
      await assertNoOverlap(tx, data.roomId, data.requestedStart, data.requestedEnd);
      return tx.labSession.create({
        data: { ...data, requestedBy: req.user.userId },
      });
    });
    res.status(201).json(session);
  })
);

// Batch create: several time ranges in one submit (e.g. 10-11 and 13-15).
// Each range becomes its own session; they share a bookingGroupId so the UI can
// group them. All-or-nothing: if one range clashes, none are created.
const MAX_BATCH = 12;

const batchSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(250).nullish(),
  projectId: z.number().int().positive().nullish(),
  roomId: z.number().int().positive(),
  slots: z
    .array(
      z
        .object({ start: z.coerce.date(), end: z.coerce.date() })
        .refine((s) => s.end > s.start, { message: "Each range must end after it starts" })
    )
    .min(1)
    .max(MAX_BATCH),
});

router.post(
  "/batch",
  asyncHandler(async (req, res) => {
    const { slots, ...rest } = batchSchema.parse(req.body);

    const sorted = [...slots].sort((a, b) => a.start - b.start);
    const now = new Date();
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].end <= now) throw new HttpError(400, "Cannot book a time in the past");
      if (i > 0 && sorted[i].start < sorted[i - 1].end) {
        throw new HttpError(400, "Time ranges must not overlap each other");
      }
    }

    const bookingGroupId = sorted.length > 1 ? crypto.randomUUID() : null;

    const created = await prisma.$transaction(async (tx) => {
      const out = [];
      for (const s of sorted) {
        await assertNoOverlap(tx, rest.roomId, s.start, s.end);
        out.push(
          await tx.labSession.create({
            data: {
              ...rest,
              requestedStart: s.start,
              requestedEnd: s.end,
              requestedBy: req.user.userId,
              bookingGroupId,
            },
          })
        );
      }
      return out;
    });
    res.status(201).json(created);
  })
);

// List: managers see everything, others see sessions they requested or joined
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = listQuery.parse(req.query);
    const user = req.user;

    const sessions = await prisma.labSession.findMany({
      where: {
        archived: q.archived === "true",
        status: q.status,
        roomId: q.roomId,
        requestedStart: q.to ? { lt: q.to } : undefined,
        requestedEnd: q.from ? { gt: q.from } : undefined,
        ...(isManager(user)
          ? {}
          : {
              OR: [
                { requestedBy: user.userId },
                { participants: { some: { userId: user.userId } } },
              ],
            }),
      },
      include: {
        room: { select: { roomId: true, name: true } },
        project: { select: { projectId: true, name: true } },
        requester: { select: personSelect },
      },
      orderBy: { requestedStart: "desc" },
    });
    res.json(sessions);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const session = await prisma.labSession.findUniqueOrThrow({
      where: { labSessionId: parseId(req.params.id) },
      include: {
        room: true,
        project: true,
        requester: { select: personSelect },
        approver: { select: personSelect },
        participants: { include: { user: { select: personSelect } } },
      },
    });

    const user = req.user;
    const involved =
      session.requestedBy === user.userId ||
      session.participants.some((p) => p.userId === user.userId);
    if (!isManager(user) && !involved) throw new HttpError(403, "Forbidden");

    res.json(session);
  })
);

// Edit details: only while pending_approval, by the requester or a manager
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = updateSchema.parse(req.body);
    const user = req.user;

    const existing = await prisma.labSession.findUniqueOrThrow({ where: { labSessionId: id } });
    if (!isManager(user) && existing.requestedBy !== user.userId) {
      throw new HttpError(403, "Forbidden");
    }
    if (existing.status !== "pending_approval") {
      throw new HttpError(409, "Only pending sessions can be edited");
    }

    const roomId = data.roomId ?? existing.roomId;
    const start = data.requestedStart ?? existing.requestedStart;
    const end = data.requestedEnd ?? existing.requestedEnd;
    if (end <= start) throw new HttpError(400, "requestedEnd must be after requestedStart");

    const updated = await prisma.$transaction(async (tx) => {
      await assertNoOverlap(tx, roomId, start, end, id);
      return tx.labSession.update({ where: { labSessionId: id }, data });
    });
    res.json(updated);
  })
);

// Status workflow: body { "status": "approved" }
router.post(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { status: next } = z.object({ status: z.enum(SESSION_STATUSES) }).parse(req.body);
    const user = req.user;

    const existing = await prisma.labSession.findUniqueOrThrow({ where: { labSessionId: id } });

    if (!TRANSITIONS[existing.status].includes(next)) {
      throw new HttpError(409, `Cannot change status from ${existing.status} to ${next}`);
    }

    // managers move sessions forward; the requester may also cancel their own
    const isOwner = existing.requestedBy === user.userId;
    const allowed = next === "cancelled" ? isManager(user) || isOwner : isManager(user);
    if (!allowed) throw new HttpError(403, "Forbidden");

    const updated = await prisma.$transaction(async (tx) => {
      // pending sessions don't hold the room, so re-check at approval time
      if (next === "approved") {
        await assertNoOverlap(tx, existing.roomId, existing.requestedStart, existing.requestedEnd, id);
      }

      const now = new Date();
      const result = await tx.labSession.updateMany({
        // guards against two people changing the status at the same moment
        where: { labSessionId: id, status: existing.status },
        data: {
          status: next,
          ...(next === "approved" || next === "rejected" ? { approvedBy: user.userId } : {}),
          ...(next === "in_progress" ? { actualStart: now } : {}),
          ...(next === "completed" ? { actualEnd: now } : {}),
        },
      });
      if (result.count === 0) throw new HttpError(409, "Session status changed, please retry");

      // tell the requester when someone else changed their session
      if (!isOwner) {
        await tx.notification.create({
          data: {
            userId: existing.requestedBy,
            labSessionId: id,
            message: `Your session "${existing.name}" is now ${next.replace("_", " ")}`,
            notifType: "status_change",
          },
        });
      }
      return tx.labSession.findUniqueOrThrow({ where: { labSessionId: id } });
    });
    res.json(updated);
  })
);

// "Delete" = archive (soft delete). Only finished sessions can be archived.
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const user = req.user;

    const existing = await prisma.labSession.findUniqueOrThrow({ where: { labSessionId: id } });
    if (!isManager(user) && existing.requestedBy !== user.userId) {
      throw new HttpError(403, "Forbidden");
    }
    if (!ARCHIVABLE.includes(existing.status)) {
      throw new HttpError(409, "Only completed, cancelled or rejected sessions can be archived");
    }

    const updated = await prisma.labSession.update({
      where: { labSessionId: id },
      data: { archived: true },
    });
    res.json(updated);
  })
);

module.exports = router;