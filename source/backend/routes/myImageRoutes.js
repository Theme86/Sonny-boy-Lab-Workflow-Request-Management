// backend/routes/myImageRoutes.js — /api/users/me/avatar and /me/banner: upload or reset my pictures.
const express = require('express');
const router = express.Router();
const { saveUserImage } = require('../utils/saveUserImage');
const { assignDefaultBanner } = require('../utils/assignDefaultBanner');
const { httpError } = require('../services/users/validation');
const { rawImage, requireImageBody, updateUser } = require('../services/users/routeHelpers');

const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BANNER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// PUT /api/users/me/avatar — upload a new profile picture (max 2 MB)
router.put('/me/avatar', rawImage(AVATAR_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const avatarUrl = saveUserImage(req.user.userId, 'avatar', req.body);
  res.json(await updateUser(req.user.userId, { avatarUrl }));
});

// PUT /api/users/me/banner — upload a new banner (max 5 MB)
router.put('/me/banner', rawImage(BANNER_MAX_BYTES), async (req, res) => {
  requireImageBody(req);
  const bannerUrl = saveUserImage(req.user.userId, 'banner', req.body);
  res.json(await updateUser(req.user.userId, { bannerUrl }));
});

// DELETE /api/users/me/banner — go back to the default banner
router.delete('/me/banner', async (req, res) => {
  const path = assignDefaultBanner(req.user.userId);
  if (!path) throw httpError(500, 'Could not restore the default banner');
  res.json(await updateUser(req.user.userId, { bannerUrl: `${path}?v=${Date.now()}` }));
});

module.exports = router;
