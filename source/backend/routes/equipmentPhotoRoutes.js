// routes/equipmentPhotoRoutes.js — PHOTO
// The raw image bytes are the request body (Content-Type image/jpeg|png|webp), max 5 MB.
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { canManage } = require('../utils/equipmentAccess');
const { httpError } = require('../utils/equipmentErrors');
const { parseId } = require('../utils/equipmentParsing');
const { equipmentInclude, toResponse } = require('../utils/equipmentResponse');
const { saveEquipmentImage } = require('../utils/saveEquipmentImage');

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const rawImage = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: IMAGE_MAX_BYTES });

// PUT /api/equipment/:id/image   body = the image file itself
router.put('/:id/image', requireAuth, canManage, rawImage, async (req, res) => {
  const equipmentId = parseId(req.params.id);
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }

  const exists = await prisma.equipment.findUnique({ where: { equipmentId }, select: { equipmentId: true } });
  if (!exists) throw httpError(404, 'Equipment not found');

  const imageUrl = saveEquipmentImage(equipmentId, req.body);
  const updated = await prisma.equipment.update({
    where: { equipmentId },
    data: { imageUrl },
    include: equipmentInclude,
  });
  res.json(toResponse(updated));
});

module.exports = router;