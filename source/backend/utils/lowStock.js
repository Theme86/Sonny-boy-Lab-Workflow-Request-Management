// backend/utils/lowStock.js
// When a consumable runs low: stock at or below its reorder threshold (0 counts as low too).
// Works with Prisma Decimal values as well as plain numbers.

const isLow = (c) => Number(c.currentStock) <= Number(c.reorderThreshold);

/** True only when an edit takes the item from normal to low, so staff are not told again on every edit while it stays low. */
const becameLow = (before, after) => !isLow(before) && isLow(after);

const amount = (value, unit) => `${Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${unit}`;

function lowStockMessage(c) {
  const reorder = `reorder at ${amount(c.reorderThreshold, c.unit)}`;
  return Number(c.currentStock) <= 0
    ? `${c.name} is out of stock (${reorder})`
    : `${c.name} is low on stock: ${amount(c.currentStock, c.unit)} left (${reorder})`;
}

module.exports = { isLow, becameLow, lowStockMessage };
