// backend/services/users/userList.js — turns the query string of GET /api/users into a Prisma query.
const { ROLES } = require('./fields');
const { buildWhere } = require('./userFilters');
const { httpError } = require('./validation');

const SORT_FIELDS = {
  createdAt: 'createdAt',
  lastLoginAt: 'lastLoginAt',
  email: 'email',
  role: 'role',
  name: 'firstName',
};

const text = (value, fallback = '') => (typeof value === 'string' ? value : fallback);

function buildOrderBy(sortKey, order) {
  const orderBy = [{ [sortKey]: order }];
  if (sortKey === 'firstName') orderBy.push({ lastName: order });
  orderBy.push({ userId: 'asc' }); // stable order between pages
  return orderBy;
}

/** query: ?q=&role=&status=active|inactive|all&sort=&order=asc|desc&page=1&pageSize=20 */
function parseListQuery(query) {
  const role = text(query.role);
  if (role && !ROLES.includes(role)) throw httpError(400, `role must be one of: ${ROLES.join(', ')}`);

  const sortKey = SORT_FIELDS[query.sort] ?? 'createdAt';
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 20));
  const where = buildWhere({ q: text(query.q).trim(), role, status: text(query.status, 'all') });

  return { where, orderBy: buildOrderBy(sortKey, order), page, pageSize };
}

module.exports = { parseListQuery };
