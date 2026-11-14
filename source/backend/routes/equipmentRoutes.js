// backend/routes/equipmentRoutes.js — mounted at /api/equipment.
// Each file below holds one kind of route. The order matters: /summary is registered before /:id.
// Express 5 forwards errors from async handlers automatically, so no asyncHandler wrapper is needed.
const express = require('express');
const router = express.Router();
 
router.use(require('./equipmentListRoutes'));
router.use(require('./equipmentReadRoutes'));
router.use(require('./equipmentCreateRoutes'));
router.use(require('./equipmentUpdateRoutes'));
router.use(require('./equipmentDeleteRoutes'));
router.use(require('./equipmentPhotoRoutes'));
router.use(require('./equipmentPhotoRemoveRoutes'));
 
module.exports = router;