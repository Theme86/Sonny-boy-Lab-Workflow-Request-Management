// services/dashboard/helpers.js — small pure functions (no database), easy to test on their own.
// Request counting lives here; stock and expiry helpers are in stockHelpers.js and re-exported.
const stock = require('./stockHelpers');

const REQUEST_STATUSES = ['open', 'in_review', 'approved', 'in_progress', 'blocked', 'completed', 'rejected', 'closed'];
/** Requests that someone still has to work on. */
const ACTIVE_REQUEST_STATUSES = ['open', 'in_review', 'approved', 'in_progress', 'blocked'];

/** [{ status, _count: { _all } }] -> { open: 2, in_review: 0, ... } with a zero for every status. */
function countByStatus(groups) {
  const counts = Object.fromEntries(REQUEST_STATUSES.map((status) => [status, 0]));
  for (const group of groups) {
    if (group.status in counts) counts[group.status] = group._count._all;
  }
  return counts;
}

/** How many requests are still being worked on. */
const activeTotal = (counts) => ACTIVE_REQUEST_STATUSES.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

module.exports = { REQUEST_STATUSES, ACTIVE_REQUEST_STATUSES, countByStatus, activeTotal, ...stock };
