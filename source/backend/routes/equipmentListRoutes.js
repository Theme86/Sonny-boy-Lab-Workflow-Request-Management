// routes/equipmentListRoutes.js — READ list
// GET /api/equipment?q=microscope&available=true&sort=location&page=1&limit=20
// q searches the name AND the location; sort is one of the keys in utils/equipmentSort.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { parseWholeNumber } = require('../utils/equipmentParsing');
const { equipmentInclude, toResponse } = require('../utils/equipmentResponse');
const { sortOrder } = require('../utils/equipmentSort');

router.get('/', requireAuth, async (req, res) => {
  const page = parseWholeNumber(req.query.page, 1, 1000000);
  const limit = parseWholeNumber(req.query.limit, 20, 100);

  const where = {};
  if (req.query.q) {
    const q = String(req.query.q);
    where.OR = [{ name: { contains: q } }, { location: { contains: q } }];
  }
  if (req.query.available === 'true') where.quantityAvailable = { gt: 0 };

  const [items, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      include: equipmentInclude,
      orderBy: sortOrder(req.query.sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.equipment.count({ where }),
  ]);

  res.json({ items: items.map(toResponse), page, limit, total });
});

module.exports = router;