// routes/equipmentCreateRoutes.js — CREATE
// POST /api/equipment
// body: { name, description?, quantityTotal?, quantityAvailable?, location?, propertyIds? }
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { canManage } = require('../utils/equipmentAccess');
const { buildData } = require('../utils/equipmentData');
const { httpError, mapPrismaError } = require('../utils/equipmentErrors');
const { parsePropertyIds } = require('../utils/equipmentParsing');
const { equipmentInclude, toResponse } = require('../utils/equipmentResponse');

router.post('/', requireAuth, canManage, async (req, res) => {
  const data = buildData(req.body ?? {}, { partial: false });
  const propertyIds = parsePropertyIds(req.body ?? {});

  // default: everything is available when first added
  if (data.quantityTotal === undefined) data.quantityTotal = 0;
  if (data.quantityAvailable === undefined) data.quantityAvailable = data.quantityTotal;

  // schema comment: CHECK (quantity_available <= quantity_total)
  if (data.quantityAvailable > data.quantityTotal) {
    throw httpError(400, 'quantityAvailable cannot exceed quantityTotal');
  }

  try {
    const created = await prisma.equipment.create({
      data: {
        ...data,
        ...(propertyIds && {
          properties: { create: propertyIds.map((propertyId) => ({ propertyId })) },
        }),
      },
      include: equipmentInclude,
    });
    res.status(201).json(toResponse(created));
  } catch (err) {
    throw mapPrismaError(err);
  }
});

module.exports = router;