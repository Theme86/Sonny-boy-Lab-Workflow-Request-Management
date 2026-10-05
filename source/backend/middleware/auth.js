//Verifies JWT cookie, gates routes

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Re-reads the logged-in user from the database so that role changes and
// deactivation take effect immediately instead of waiting for the JWT to expire.
// Use after requireAuth: router.get('/x', requireAuth, requireActiveUser, ...)
async function requireActiveUser(req, res, next) {
  try {
    const { prisma } = require('../lib/prisma');
    const current = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      select: { userId: true, role: true, active: true },
    });
    if (!current) return res.status(401).json({ error: 'User no longer exists' });
    if (!current.active) return res.status(403).json({ error: 'Account disabled' });
    req.user = { ...req.user, role: current.role };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, requireRole, requireActiveUser };