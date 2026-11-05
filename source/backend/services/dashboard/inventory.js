// services/dashboard/inventory.js — consumables and equipment, read-only. Every logged-in user may see these.
const { toNumber, isLowStock, daysUntil, expiryState, byStockRatio, byExpiry, limited } = require('./helpers');

const LIST_LIMIT = 6;

const hazardNames = (consumable) => consumable.hazards.map((h) => h.hazard.name);

function toConsumableItem(consumable, now) {
  const expiry = consumable.expiryDate;
  return {
    consumableId: consumable.consumableId,
    name: consumable.name,
    unit: consumable.unit,
    currentStock: toNumber(consumable.currentStock),
    reorderThreshold: toNumber(consumable.reorderThreshold),
    expiryDate: expiry,
    daysLeft: expiry ? daysUntil(expiry, now) : null,
    expiry: expiryState(expiry, now),
    hazards: hazardNames(consumable),
  };
}

/** Running low (at or under the reorder level) and expired or expiring soon. */
async function consumableSummary(prisma, now) {
  const rows = await prisma.consumable.findMany({
    select: {
      consumableId: true,
      name: true,
      unit: true,
      currentStock: true,
      reorderThreshold: true,
      expiryDate: true,
      hazards: { select: { hazard: { select: { name: true } } } },
    },
  });
  const items = rows.map((row) => toConsumableItem(row, now));

  return {
    total: items.length,
    lowStock: limited(items.filter(isLowStock).sort(byStockRatio), LIST_LIMIT),
    expiring: limited(items.filter((item) => item.expiry).sort(byExpiry), LIST_LIMIT),
  };
}

/** How much equipment is free, and which kinds are all taken. */
async function equipmentSummary(prisma) {
  const rows = await prisma.equipment.findMany({
    select: { equipmentId: true, name: true, quantityAvailable: true, quantityTotal: true },
  });
  const sum = (field) => rows.reduce((total, row) => total + row[field], 0);

  return {
    kinds: rows.length,
    unitsAvailable: sum('quantityAvailable'),
    unitsTotal: sum('quantityTotal'),
    allTaken: limited(
      rows.filter((row) => row.quantityTotal > 0 && row.quantityAvailable <= 0),
      LIST_LIMIT,
    ),
  };
}

module.exports = { consumableSummary, equipmentSummary };
