// utils/equipmentData.js — validates the request body and picks only the fields we allow.
const { httpError } = require('./equipmentErrors');
const { INT_MAX, isNonNegInt } = require('./equipmentParsing');

// Matches the schema.prisma limits. partial = true for PATCH.
function buildData(body, { partial }) {
  const data = {};

  if (body.name !== undefined || !partial) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150) {
      throw httpError(400, 'name is required (max 150 chars)');
    }
    data.name = body.name.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && (typeof body.description !== 'string' || body.description.length > 250)) {
      throw httpError(400, 'description must be a string (max 250 chars) or null');
    }
    data.description = body.description;
  }

  if (body.location !== undefined) {
    if (body.location !== null && (typeof body.location !== 'string' || body.location.length > 100)) {
      throw httpError(400, 'location must be a string (max 100 chars) or null');
    }
    data.location = body.location;
  }

  // imageUrl is not accepted here: the photo only changes through PUT / DELETE /:id/image, which check the file.

  if (body.quantityTotal !== undefined) {
    if (!isNonNegInt(body.quantityTotal)) throw httpError(400, `quantityTotal must be an integer from 0 to ${INT_MAX}`);
    data.quantityTotal = body.quantityTotal;
  }

  if (body.quantityAvailable !== undefined) {
    if (!isNonNegInt(body.quantityAvailable)) throw httpError(400, `quantityAvailable must be an integer from 0 to ${INT_MAX}`);
    data.quantityAvailable = body.quantityAvailable;
  }

  return data;
}

module.exports = { buildData };