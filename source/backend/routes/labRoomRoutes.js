import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, parseId, requireRole } from "../middleware/helpers";

const router = Router();

const roomSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().int().positive().nullish(),
  location: z.string().max(100).nullish(),
});

// Any logged-in user can read rooms
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.labRoom.findMany({ orderBy: { name: "asc" } }));
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

// Only lab managers can change rooms
router.post(
  "/",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    const data = roomSchema.parse(req.body);
    res.status(201).json(await prisma.labRoom.create({ data }));
  })
);

router.patch(
  "/:id",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    const data = roomSchema.partial().parse(req.body);
    const room = await prisma.labRoom.update({
      where: { roomId: parseId(req.params.id) },
      data,
    });
    res.json(room);
  })
);

// Fails with 409 if any session still references the room (FK)
router.delete(
  "/:id",
  requireRole("lab_manager"),
  asyncHandler(async (req, res) => {
    await prisma.labRoom.delete({ where: { roomId: parseId(req.params.id) } });
    res.status(204).end();
  })
);

module.exports = router;