// services/dashboard/helpers.js — small pure functions (no database), easy to test on their own.

const REQUEST_STATUSES = ['open', 'in_review', 'approved', 'in_progress', 'blocked', 'completed', 'rejected', 'closed'];
/** Requests that someone still has to work on. */
const ACTIVE_REQUEST_STATUSES = ['open', 'in_review', 'approved', 'in_progress', 'blocked'];

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRY_WARNING_DAYS = 30;

/** Prisma returns Decimal columns as objects; the dashboard wants plain numbers. */
const toNumber = (value) => (value == null ? null : Number(value));

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

/** At or under the reorder level (an item with no level set is only low once it is empty). */
const isLowStock = ({ currentStock, reorderThreshold }) => currentStock <= reorderThreshold;

/** Whole days from `now` to `date`, rounded up; negative once it has passed. */
const daysUntil = (date, now) => Math.ceil((new Date(date).getTime() - now.getTime()) / DAY_MS);

/** 'expired', 'soon' (within the warning period) or null. */
function expiryState(date, now, warningDays = EXPIRY_WARNING_DAYS) {
  if (!date) return null;
  const days = daysUntil(date, now);
  if (days <= 0) return 'expired';
  return days <= warningDays ? 'soon' : null;
}

/** Lowest stock compared with its reorder level first; empty items before everything else. */
const byStockRatio = (a, b) => ratio(a) - ratio(b);
const ratio = ({ currentStock, reorderThreshold }) => (reorderThreshold > 0 ? currentStock / reorderThreshold : currentStock);

/** Expired first, then the soonest to expire. */
const byExpiry = (a, b) => a.daysLeft - b.daysLeft;

/** Keeps the first `limit` items but remembers how many there were in total. */
const limited = (items, limit) => ({ total: items.length, items: items.slice(0, limit) });

module.exports = {
  REQUEST_STATUSES,
  ACTIVE_REQUEST_STATUSES,
  EXPIRY_WARNING_DAYS,
  toNumber,
  countByStatus,
  activeTotal,
  isLowStock,
  daysUntil,
  expiryState,
  byStockRatio,
  byExpiry,
  limited,
};
