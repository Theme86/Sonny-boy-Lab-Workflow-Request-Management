// routes/equipmentDeleteRoutes.js — DELETE
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { canManage } = require('../utils/equipmentAccess');
const { mapPrismaError } = require('../utils/equipmentErrors');
const { parseId } = require('../utils/equipmentParsing');
const { deleteEquipmentImage } = require('../utils/saveEquipmentImage');
const { deleteEquipment } = require('../utils/equipmentWrites');

// DELETE /api/equipment/:id
router.delete('/:id', requireAuth, canManage, async (req, res) => {
  const equipmentId = parseId(req.params.id);

  try {
    await deleteEquipment(equipmentId);
    deleteEquipmentImage(equipmentId); // remove the photo file too
    res.status(204).end();
  } catch (err) {
    throw mapPrismaError(err);
  }
});

module.exports = router;