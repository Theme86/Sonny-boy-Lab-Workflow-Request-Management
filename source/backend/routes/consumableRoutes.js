const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { saveConsumableImage, deleteConsumableImage } = require('../utils/saveConsumableImage');
const { validateConsumableInput } = require('../utils/validateConsumable');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: IMAGE_MAX_BYTES });
const canManage = requireRole('lab_manager', 'lecturer');

const FIELDS = ['name', 'unit', 'currentStock', 'reorderThreshold', 'expiryDate', 'description', 'phValue', 'imageUrl'];
const HAZARD_SELECT = { hazardId: true, code: true, name: true };
const LIST_SELECT = {
  ...Object.fromEntries(['consumableId', ...FIELDS].map((f) => [f, true])),
  hazards: { select: { hazard: { select: HAZARD_SELECT } } },
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'Invalid consumable id');
  return id;
}

// Prisma's "record not found" (P2025) becomes a 404; a row still referenced elsewhere (P2003) becomes a 409.
async function orNotFound(work) {
  try {
    return await work();
  } catch (err) {
    if (err.code === 'P2025') throw httpError(404, 'Consumable not found');
    if (err.code === 'P2003') throw httpError(409, 'This consumable is used by a lab session or an order, so it cannot be deleted');
    throw err;
  }
}

// same shape as requestRoutes, so the frontend's apiFetch can show each message under its field
const sendInvalid = (res, details) => res.status(400).json({ error: 'Validation failed', details });

// Prisma Decimal columns are sent as numbers, and the haz_con join rows become a plain hazards list.
const toJson = (c) => ({
  ...c,
  currentStock: Number(c.currentStock),
  reorderThreshold: Number(c.reorderThreshold),
  phValue: c.phValue == null ? null : Number(c.phValue),
  ...(c.hazards && { hazards: c.hazards.map((link) => link.hazard) }),
});

async function unknownHazards(hazardIds) {
  if (!hazardIds?.length) return null;
  const found = await prisma.hazard.count({ where: { hazardId: { in: hazardIds } } });
  return found === hazardIds.length ? null : { hazardIds: 'Choose hazards from the list' };
}

// replaces every hazard link of the item with `hazardIds`
async function setHazards(tx, consumableId, hazardIds) {
  await tx.hazCon.deleteMany({ where: { consumableId } });
  if (hazardIds.length) await tx.hazCon.createMany({ data: hazardIds.map((hazardId) => ({ consumableId, hazardId })) });
}

// GET /api/consumables/hazards   the GHS hazards that can be attached to a consumable
router.get('/hazards', requireAuth, async (req, res) => {
  const hazards = await prisma.hazard.findMany({
    select: { ...HAZARD_SELECT, description: true },
    orderBy: [{ code: 'asc' }, { name: 'asc' }],
  });
  res.json(hazards);
});

// GET /api/consumables?search=
router.get('/', requireAuth, async (req, res) => {
  const { search } = req.query;
  const consumables = await prisma.consumable.findMany({
    where: search ? { name: { contains: search } } : undefined,
    select: LIST_SELECT,
    orderBy: { name: 'asc' },
  });
  res.json(consumables.map(toJson));
});

// POST /api/consumables
// body: { name, unit, currentStock?, reorderThreshold?, expiryDate?, description?, phValue?, imageUrl?, hazardIds? }
router.post('/', requireAuth, canManage, async (req, res) => {
  const { ok, errors, data } = validateConsumableInput(req.body);
  if (!ok) return sendInvalid(res, errors);
  const { hazardIds, ...fields } = data;
  const linkErrors = await unknownHazards(hazardIds);
  if (linkErrors) return sendInvalid(res, linkErrors);

  const consumable = await prisma.consumable.create({
    data: { ...fields, hazards: { create: hazardIds.map((hazardId) => ({ hazardId })) } },
  });
  res.status(201).json(consumable);
});

// PUT /api/consumables/:id   body: any of the POST fields; only the fields sent are changed.
// hazardIds, if sent, replaces the whole hazard list.
router.put('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  const before = await prisma.consumable.findUnique({ where: { consumableId }, select: { unit: true, imageUrl: true } });
  if (!before) throw httpError(404, 'Consumable not found');

  // an item saved with an old free-text unit (e.g. "bottle") can still be edited without changing it
  const { ok, errors, data } = validateConsumableInput(req.body, { partial: true, extraUnits: [before.unit] });
  if (!ok) return sendInvalid(res, errors);
  const { hazardIds, ...fields } = data;
  const linkErrors = await unknownHazards(hazardIds);
  if (linkErrors) return sendInvalid(res, linkErrors);

  const consumable = await orNotFound(() =>
    prisma.$transaction(async (tx) => {
      if (hazardIds) await setHazards(tx, consumableId, hazardIds);
      return tx.consumable.update({ where: { consumableId }, data: fields });
    }),
  );
  // a new or cleared imageUrl replaces an uploaded photo, so the old file is removed
  if (fields.imageUrl !== undefined && before.imageUrl !== fields.imageUrl) deleteConsumableImage(consumableId);

  res.json(consumable);
});

// DELETE /api/consumables/:id   hazard links go with it; 409 if a lab session or order still uses it
router.delete('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  await orNotFound(() =>
    prisma.$transaction(async (tx) => {
      await tx.hazCon.deleteMany({ where: { consumableId } });
      return tx.consumable.delete({ where: { consumableId } });
    }),
  );
  deleteConsumableImage(consumableId);
  res.status(204).send();
});

// PUT /api/consumables/:id/image   body = the image file itself
router.put('/:id/image', requireAuth, canManage, rawImage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }

  const exists = await prisma.consumable.findUnique({ where: { consumableId }, select: { consumableId: true } });
  if (!exists) throw httpError(404, 'Consumable not found');

  const imageUrl = saveConsumableImage(consumableId, req.body);
  res.json(await prisma.consumable.update({ where: { consumableId }, data: { imageUrl } }));
});

// DELETE /api/consumables/:id/image   removes the photo
router.delete('/:id/image', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  const updated = await orNotFound(() => prisma.consumable.update({ where: { consumableId }, data: { imageUrl: null } }));
  deleteConsumableImage(consumableId);
  res.json(updated);
});

module.exports = router;
