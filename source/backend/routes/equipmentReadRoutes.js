// routes/equipmentReadRoutes.js — SUMMARY (for the cards above the table) and READ one.
// The summary route must stay ABOVE GET /:id, otherwise "summary" would be read as an id.
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { httpError } = require('../utils/equipmentErrors');
const { parseId } = require('../utils/equipmentParsing');
const { equipmentInclude, toResponse } = require('../utils/equipmentResponse');

// GET /api/equipment/summary  ->  { total, inStock, low, out }
// Same rule as stockLevel() in frontend/lib/equipmentStock.ts: out = none free, low = 25% or less free.
router.get('/summary', requireAuth, async (req, res) => {
  const rows = await prisma.equipment.findMany({ select: { quantityTotal: true, quantityAvailable: true } });

  const summary = { total: rows.length, inStock: 0, low: 0, out: 0 };
  for (const { quantityTotal, quantityAvailable } of rows) {
    if (quantityAvailable <= 0) summary.out += 1;
    else if (quantityTotal > 0 && quantityAvailable / quantityTotal <= 0.25) summary.low += 1;
    else summary.inStock += 1;
  }
  res.json(summary);
});

// GET /api/equipment/:id
router.get('/:id', requireAuth, async (req, res) => {
  const equipmentId = parseId(req.params.id);

  const equipment = await prisma.equipment.findUnique({
    where: { equipmentId },
    include: equipmentInclude,
  });
  if (!equipment) throw httpError(404, 'Equipment not found');

  res.json(toResponse(equipment));
});

module.exports = router;