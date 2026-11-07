// backend/services/users/routeHelpers.js — small helpers the user routes share.
const express = require('express');
const { prisma } = require('../../lib/prisma');
const { ALL_FIELDS } = require('./fields');
const { httpError } = require('./validation');

// Accepts the raw image bytes as the request body (Content-Type: image/jpeg|png|webp)
function rawImage(maxBytes) {
  return express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: maxBytes });
}

function requireImageBody(req) {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    throw httpError(400, 'Send the image file as the request body with Content-Type image/jpeg, image/png or image/webp');
  }
}

const updateUser = (userId, data) => prisma.user.update({ where: { userId }, data, select: ALL_FIELDS });

async function requireUserExists(userId) {
  const exists = await prisma.user.findUnique({ where: { userId }, select: { userId: true } });
  if (!exists) throw httpError(404, 'User not found');
}

module.exports = { rawImage, requireImageBody, updateUser, requireUserExists };
