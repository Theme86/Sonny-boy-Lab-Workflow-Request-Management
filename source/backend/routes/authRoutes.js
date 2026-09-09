// backend/routes/authRoute.js
const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken' });
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'Invalid Google token' });
  }

  const { sub: googleId, email, given_name, family_name, picture } = payload;

  let user = await prisma.users.findUnique({ where: { googleId } });

  if (!user) {
    user = await prisma.users.findUnique({ where: { email } });
    if (user) {
      user = await prisma.users.update({
        where: { email },
        data: { googleId, lastLoginAt: new Date() },
      });
    } else {
      user = await prisma.users.create({
        data: {
          googleId,
          email,
          firstName: given_name ?? '',
          lastName: family_name ?? '',
          avatarUrl: picture,
          lastLoginAt: new Date(),
        },
      });
    }
  } else {
    user = await prisma.users.update({
      where: { googleId },
      data: { lastLoginAt: new Date() },
    });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'Account disabled' });
  }

  const token = jwt.sign(
    { userId: user.userId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000,
  });

  res.json({
    user: {
      id: user.userId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});


router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { userId: req.user.userId },
    select: { userId: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true },
  });
  res.json({ user });
});


router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ ok: true });
});


module.exports = router;