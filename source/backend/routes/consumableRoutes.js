const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

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

module.exports = router;
