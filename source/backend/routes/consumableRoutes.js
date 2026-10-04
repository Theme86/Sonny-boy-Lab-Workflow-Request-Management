const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth,  requireRole } = require('../middleware/auth');

// GET /api/consumables
router.get('/', requireAuth,  async (req, res) => {
    const search = req.query.search;
    const consumables =  await prisma.consumables.findMany({
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
        },
        orderBy: {name: 'asc'}
    }
    );
    res.json(
  consumables.map((c) => ({
    ...c,
    currentStock: Number(c.currentStock),
    reorderThreshold: Number(c.reorderThreshold),
  }))
);
})

router.post('/', requireAuth, requireRole('lab_manager', 'lecturer'), async (req, res) => {
  const { name, unit, currentStock, reorderThreshold, expiryDate, description, phValue, imageUrl } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ error: 'name and unit are required' });
  }

  const consumable = await prisma.consumables.create({
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
    const consumable = await prisma.consumables.update({
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
    await prisma.consumables.delete({ where: { consumableId } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Consumable not found' });
    }
    throw err;
  }
});


module.exports = router;
