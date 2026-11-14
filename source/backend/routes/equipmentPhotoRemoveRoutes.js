// routes/equipmentPhotoRemoveRoutes.js — PHOTO removal
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { canManage } = require('../utils/equipmentAccess');
const { mapPrismaError } = require('../utils/equipmentErrors');
const { parseId } = require('../utils/equipmentParsing');
const { equipmentInclude, toResponse } = require('../utils/equipmentResponse');
const { deleteEquipmentImage } = require('../utils/saveEquipmentImage');

// DELETE /api/equipment/:id/image   removes the photo
router.delete('/:id/image', requireAuth, canManage, async (req, res) => {
  const equipmentId = parseId(req.params.id);
  try {
    const updated = await prisma.equipment.update({
      where: { equipmentId },
      data: { imageUrl: null },
      include: equipmentInclude,
    });
    deleteEquipmentImage(equipmentId);
    res.json(toResponse(updated));
  } catch (err) {
    throw mapPrismaError(err);
  }
});

module.exports = router;