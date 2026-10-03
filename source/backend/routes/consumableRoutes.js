const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/consumables
router.get('/', requireAuth,  async (req, res) => {
    const consumables =  await prisma.consumables.findMany({
        select: {
            consumableId: true,
            name: true,
            unit: true,
            currentStock: true,
            expiryDate: true,
        },
        orderBy: {name: 'asc'}
    }
    );
    res.json(consumables);
})

module.exports = router;
