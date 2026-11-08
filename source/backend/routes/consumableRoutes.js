const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { saveConsumableImage, deleteConsumableImage } = require('../utils/saveConsumableImage');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: IMAGE_MAX_BYTES });
const canManage = requireRole('lab_manager', 'lecturer');

const FIELDS = ['name', 'unit', 'currentStock', 'reorderThreshold', 'expiryDate', 'description', 'phValue', 'imageUrl'];
const LIST_SELECT = Object.fromEntries(['consumableId', ...FIELDS].map((f) => [f, true]));

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

// Prisma's "record not found" (P2025) becomes a 404.
async function orNotFound(work) {
  try {
    return await work();
  } catch (err) {
    if (err.code === 'P2025') throw httpError(404, 'Consumable not found');
    throw err;
  }
}

/** Only the fields present in the body, so PUT can update some fields and leave the rest. */
function pickFields(body) {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] === undefined) continue;
    data[field] = field === 'expiryDate' ? (body.expiryDate ? new Date(body.expiryDate) : null) : body[field];
  }
  return data;
}

// Prisma Decimal columns are sent as numbers.
const toJson = (c) => ({
  ...c,
  currentStock: Number(c.currentStock),
  reorderThreshold: Number(c.reorderThreshold),
  phValue: c.phValue == null ? null : Number(c.phValue),
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

// POST /api/consumables   body: { name, unit, currentStock?, reorderThreshold?, expiryDate?, description?, phValue?, imageUrl? }
router.post('/', requireAuth, canManage, async (req, res) => {
  const fields = pickFields(req.body);
  if (!fields.name || !fields.unit) throw httpError(400, 'name and unit are required');

  const consumable = await prisma.consumable.create({
    data: {
      ...fields,
      currentStock: fields.currentStock ?? 0,
      reorderThreshold: fields.reorderThreshold ?? 0,
      expiryDate: fields.expiryDate ?? null,
      description: fields.description ?? null,
      phValue: fields.phValue ?? null,
      imageUrl: fields.imageUrl ?? null,
    },
  });
  res.status(201).json(consumable);
});

// PUT /api/consumables/:id   body: any of the POST fields
router.put('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  const data = pickFields(req.body);

  // a new or cleared imageUrl replaces an uploaded photo, so the old file is removed
  const before = data.imageUrl !== undefined
    ? await prisma.consumable.findUnique({ where: { consumableId }, select: { imageUrl: true } })
    : null;
  const consumable = await orNotFound(() => prisma.consumable.update({ where: { consumableId }, data }));
  if (before && before.imageUrl !== data.imageUrl) deleteConsumableImage(consumableId);

  res.json(consumable);
});

// DELETE /api/consumables/:id
router.delete('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  await orNotFound(() => prisma.consumable.delete({ where: { consumableId } }));
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
