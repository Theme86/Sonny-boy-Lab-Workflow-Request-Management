const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth,  requireRole } = require('../middleware/auth');
const { saveConsumableImage, deleteConsumableImage } = require('../utils/saveConsumableImage');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: IMAGE_MAX_BYTES });

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

// GET /api/consumables
router.get('/', requireAuth,  async (req, res) => {
    const search = req.query.search;
    const consumables =  await prisma.consumable.findMany({
        where: search
            ? { name: { contains: search } }
            : undefined,
        select: {
            consumableId: true,
            name: true,
            unit: true,
            currentStock: true,
            reorderThreshold: true,
            expiryDate: true,
            description: true,
            phValue: true,
            imageUrl: true,
        },
        orderBy: {name: 'asc'}
    }
    );
    res.json(
  consumables.map((c) => ({
    ...c,
    currentStock: Number(c.currentStock),
    reorderThreshold: Number(c.reorderThreshold),
    phValue: c.phValue == null? null : Number(c.phValue),
  }))
);
})

router.post('/', requireAuth, requireRole('lab_manager', 'lecturer'), async (req, res) => {
  const { name, unit, currentStock, reorderThreshold, expiryDate, description, phValue, imageUrl } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ error: 'name and unit are required' });
  }

  const consumable = await prisma.consumable.create({
    data: {
      name,
      unit,
      currentStock: currentStock ?? 0,
      reorderThreshold: reorderThreshold ?? 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      description: description ?? null,
      phValue: phValue ?? null,
      imageUrl: imageUrl ?? null,
    },
  });

  res.status(201).json(consumable);
});

router.put('/:id', requireAuth, requireRole('lab_manager', 'lecturer'), async (req, res) => {
  const consumableId = Number(req.params.id);

  if (!Number.isInteger(consumableId) || consumableId <= 0) {
    return res.status(400).json({ error: 'Invalid consumable id' });
  }

  const { name, unit, currentStock, reorderThreshold, expiryDate, description, phValue, imageUrl } = req.body;

  try {
    const current = imageUrl !== undefined
      ? await prisma.consumable.findUnique({ where: { consumableId }, select: { imageUrl: true } })
      : null;
    const consumable = await prisma.consumable.update({
      where: { consumableId },
      data: {
        ...(name !== undefined && { name }),
        ...(unit !== undefined && { unit }),
        ...(currentStock !== undefined && { currentStock }),
        ...(reorderThreshold !== undefined && { reorderThreshold }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(description !== undefined && { description }),
        ...(phValue !== undefined && { phValue }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
    if (current && current.imageUrl !== imageUrl) deleteConsumableImage(consumableId);

    res.json(consumable);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    throw err;
  }
});

router.delete('/:id', requireAuth, requireRole('lab_manager', 'lecturer'), async (req, res) => {
  const consumableId = Number(req.params.id);

  if (!Number.isInteger(consumableId) || consumableId <= 0) {
    return res.status(400).json({ error: 'Invalid consumable id' });
  }

  try {
    await prisma.consumable.delete({ where: { consumableId } });
    deleteConsumableImage(consumableId);
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    throw err;
  }
});

// PUT /api/consumables/:id/image   body = the image file itself
router.put('/:id/image', requireAuth, requireRole('lab_manager', 'lecturer'), rawImage, async (req, res) => {
  const consumableId = parseId(req.params.id);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }

  const exists = await prisma.consumable.findUnique({ where: { consumableId }, select: { consumableId: true } });
  if (!exists) throw httpError(404, 'Consumable not found');

  const imageUrl = saveConsumableImage(consumableId, req.body);
  const updated = await prisma.consumable.update({
    where: { consumableId },
    data: { imageUrl },
  });
  res.json(updated);
});

// DELETE /api/consumables/:id/image   removes the photo
router.delete('/:id/image', requireAuth, requireRole('lab_manager', 'lecturer'), async (req, res) => {
  const consumableId = parseId(req.params.id);
  try {
    const updated = await prisma.consumable.update({
      where: { consumableId },
      data: { imageUrl: null },
    });
    deleteConsumableImage(consumableId);
    res.json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    throw err;
  }
});


module.exports = router;
