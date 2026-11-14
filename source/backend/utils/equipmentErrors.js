// utils/equipmentErrors.js — error helpers shared by the equipment routes.

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Prisma error codes -> clean HTTP errors
function mapPrismaError(err) {
  if (err.code === 'P2025') return httpError(404, 'Equipment not found');
  if (err.code === 'P2003') return httpError(409, 'Invalid propertyId, or equipment is still referenced by other data');
  return err;
}

module.exports = { httpError, mapPrismaError };