const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { saveConsumableImage, deleteConsumableImage } = require('../utils/saveConsumableImage');
const { validateConsumableInput } = require('../utils/validateConsumable');
const { becameLow, lowStockMessage } = require('../utils/lowStock');
const { approverIds, notifyUsers } = require('../utils/notify');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: IMAGE_MAX_BYTES });
const canManage = requireRole('lab_manager', 'lecturer');

const FIELDS = ['name', 'unit', 'currentStock', 'reorderThreshold', 'expiryDate', 'description', 'phValue', 'imageUrl'];

// Lists kept in join tables. name = field on Consumable and in the JSON; idsField = what the body sends;
// join = join table model; relation = field on the join row; target / key = the list table and its id.
const LINKS = [
  { name: 'hazards', idsField: 'hazardIds', join: 'hazCon', relation: 'hazard', target: 'hazard', key: 'hazardId',
    select: { hazardId: true, code: true, name: true }, unknown: 'Choose hazards from the list' },
  { name: 'properties', idsField: 'propertyIds', join: 'propCon', relation: 'property', target: 'consumableProperty', key: 'propertyId',
    select: { propertyId: true, name: true, description: true }, unknown: 'Choose properties from the list' },
];

const LIST_SELECT = {
  ...Object.fromEntries(['consumableId', ...FIELDS].map((f) => [f, true])),
  ...Object.fromEntries(LINKS.map((l) => [l.name, { select: { [l.relation]: { select: l.select } } }])),
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

// Prisma Decimal columns are sent as numbers, and join rows become plain lists (hazards: [{ hazardId, code, name }]).
const toJson = (c) => ({
  ...c,
  currentStock: Number(c.currentStock),
  reorderThreshold: Number(c.reorderThreshold),
  phValue: c.phValue == null ? null : Number(c.phValue),
  ...Object.fromEntries(LINKS.filter((l) => c[l.name]).map((l) => [l.name, c[l.name].map((row) => row[l.relation])])),
});

/** Splits validated data into Consumable columns and the id lists (undefined when not sent). */
function splitLinks(data) {
  const fields = { ...data };
  const ids = {};
  for (const l of LINKS) {
    ids[l.name] = fields[l.idsField];
    delete fields[l.idsField];
  }
  return { fields, ids };
}

async function unknownLinkIds(ids) {
  const details = {};
  for (const l of LINKS) {
    const list = ids[l.name];
    if (!list?.length) continue;
    const found = await prisma[l.target].count({ where: { [l.key]: { in: list } } });
    if (found !== list.length) details[l.idsField] = l.unknown;
  }
  return Object.keys(details).length ? details : null;
}

// each list that was sent replaces all of the item's links for that list
async function replaceLinks(tx, consumableId, ids) {
  for (const l of LINKS) {
    const list = ids[l.name];
    if (!list) continue;
    await tx[l.join].deleteMany({ where: { consumableId } });
    if (list.length) await tx[l.join].createMany({ data: list.map((id) => ({ consumableId, [l.key]: id })) });
  }
}

// GET /api/consumables/hazards   the GHS hazards that can be attached to a consumable
router.get('/hazards', requireAuth, async (req, res) => {
  const hazards = await prisma.hazard.findMany({
    select: { hazardId: true, code: true, name: true, description: true },
    orderBy: [{ code: 'asc' }, { name: 'asc' }],
  });
  res.json(hazards);
});

// GET /api/consumables/properties   the property tags that can be attached to a consumable
router.get('/properties', requireAuth, async (req, res) => {
  const properties = await prisma.consumableProperty.findMany({
    select: { propertyId: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
  res.json(properties);
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
// body: { name, unit, currentStock?, reorderThreshold?, expiryDate?, description?, phValue?, imageUrl?, hazardIds?, propertyIds? }
router.post('/', requireAuth, canManage, async (req, res) => {
  const { ok, errors, data } = validateConsumableInput(req.body);
  if (!ok) return sendInvalid(res, errors);
  const { fields, ids } = splitLinks(data);
  const linkErrors = await unknownLinkIds(ids);
  if (linkErrors) return sendInvalid(res, linkErrors);

  const nested = Object.fromEntries(LINKS.map((l) => [l.name, { create: ids[l.name].map((id) => ({ [l.key]: id })) }]));
  const consumable = await prisma.consumable.create({ data: { ...fields, ...nested } });
  res.status(201).json(consumable);
});

// PUT /api/consumables/:id   body: any of the POST fields; only the fields sent are changed.
// hazardIds / propertyIds, if sent, replace that whole list.
router.put('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  const before = await prisma.consumable.findUnique({
    where: { consumableId },
    select: { unit: true, imageUrl: true, currentStock: true, reorderThreshold: true },
  });
  if (!before) throw httpError(404, 'Consumable not found');

  // an item saved with an old free-text unit (e.g. "bottle") can still be edited without changing it
  const { ok, errors, data } = validateConsumableInput(req.body, { partial: true, extraUnits: [before.unit] });
  if (!ok) return sendInvalid(res, errors);
  const { fields, ids } = splitLinks(data);
  const linkErrors = await unknownLinkIds(ids);
  if (linkErrors) return sendInvalid(res, linkErrors);

  const consumable = await orNotFound(() =>
    prisma.$transaction(async (tx) => {
      await replaceLinks(tx, consumableId, ids);
      const updated = await tx.consumable.update({ where: { consumableId }, data: fields });
      // tell the lecturers and lab managers (not the person who made the edit) that it needs reordering
      if (becameLow(before, updated)) {
        await notifyUsers(tx, await approverIds(tx, req.user.userId), {
          target: { consumableId },
          message: lowStockMessage(updated),
          notifType: 'low_stock',
        });
      }
      return updated;
    }),
  );
  // a new or cleared imageUrl replaces an uploaded photo, so the old file is removed
  if (fields.imageUrl !== undefined && before.imageUrl !== fields.imageUrl) deleteConsumableImage(consumableId);

  res.json(consumable);
});

// DELETE /api/consumables/:id   hazard / property links go with it; 409 if a lab session or order still uses it
router.delete('/:id', requireAuth, canManage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  await orNotFound(() =>
    prisma.$transaction(async (tx) => {
      for (const l of LINKS) await tx[l.join].deleteMany({ where: { consumableId } });
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
