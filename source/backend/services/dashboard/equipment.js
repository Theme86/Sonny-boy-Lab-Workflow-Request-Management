// services/dashboard/equipment.js — how much equipment is free, and which kinds are all taken.
const { limited } = require('./stockHelpers');

const LIST_LIMIT = 6;

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

module.exports = { equipmentSummary };
