// backend/services/users/fields.js — which user columns each kind of viewer may see, and the allowed roles.

const ROLES = ['member', 'ta', 'lecturer', 'lab_manager'];

// Fields any logged-in user may see about another user.
// googleId is intentionally excluded — no reason to expose it to clients.
const PUBLIC_FIELDS = {
  userId: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  avatarUrl: true,
  bannerUrl: true,
  createdAt: true,
  lastLoginAt: true,
  active: true,
  department: true,
  bio: true,
  profileCompletedAt: true,
};

// Contact/ID details: only the user themself and the Lab Manager can see these.
const PRIVATE_FIELDS = {
  studentId: true,
  phone: true,
};

const ALL_FIELDS = { ...PUBLIC_FIELDS, ...PRIVATE_FIELDS };

module.exports = { ROLES, PUBLIC_FIELDS, PRIVATE_FIELDS, ALL_FIELDS };
