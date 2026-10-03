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



module.exports = router;
