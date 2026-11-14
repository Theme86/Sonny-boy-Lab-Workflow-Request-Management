// routes/equipmentUpdateRoutes.js — UPDATE
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { canManage } = require('../utils/equipmentAccess');
const { buildData } = require('../utils/equipmentData');
const { httpError, mapPrismaError } = require('../utils/equipmentErrors');
const { parseId, parsePropertyIds } = require('../utils/equipmentParsing');
const { toResponse } = require('../utils/equipmentResponse');
const { updateEquipment } = require('../utils/equipmentWrites');

// PATCH /api/equipment/:id
router.patch('/:id', requireAuth, canManage, async (req, res) => {
  const equipmentId = parseId(req.params.id);
  const data = buildData(req.body ?? {}, { partial: true });
  const propertyIds = parsePropertyIds(req.body ?? {});

  const current = await prisma.equipment.findUnique({ where: { equipmentId } });
  if (!current) throw httpError(404, 'Equipment not found');

  // validate the quantity rule against the final merged values
  const total = data.quantityTotal ?? current.quantityTotal;
  const available = data.quantityAvailable ?? current.quantityAvailable;
  if (available > total) {
    throw httpError(400, 'quantityAvailable cannot exceed quantityTotal');
  }

  try {
    res.json(toResponse(await updateEquipment(equipmentId, data, propertyIds)));
  } catch (err) {
    throw mapPrismaError(err);
  }
});

module.exports = router;