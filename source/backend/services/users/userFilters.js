// backend/services/users/userFilters.js — the Prisma `where` for the user list: role, active status and the search box.
const SEARCHED_COLUMNS = ['firstName', 'lastName', 'email', 'studentId', 'department'];

function buildWhere({ q, role, status }) {
  const where = {};
  if (role) where.role = role;
  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;
  if (q) where.OR = SEARCHED_COLUMNS.map((column) => ({ [column]: { contains: q } }));
  return where;
}

module.exports = { buildWhere };
