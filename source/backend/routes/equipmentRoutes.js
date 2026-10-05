// backend/routes/equipmentRoutes.js
const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

// Express 5 forwards errors from async handlers automatically,
// so no asyncHandler wrapper is needed here.

// Roles allowed to create / edit / delete equipment
const canManage = requireRole('lab_manager');

// ---------- helpers ----------

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw httpError(400, 'Invalid id');
  return n;
}

function isNonNegInt(v) {
  return Number.isInteger(v) && v >= 0;
}

// Validates + picks only the fields we allow, matching schema.prisma limits.
// partial = true for PATCH 
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

  if (body.imageUrl !== undefined) {
    if (body.imageUrl !== null && (typeof body.imageUrl !== 'string' || body.imageUrl.length > 500)) {
      throw httpError(400, 'imageUrl must be a string (max 500 chars) or null');
    }
    data.imageUrl = body.imageUrl;
  }

  if (body.categoryId !== undefined) {
    if (body.categoryId !== null && !(Number.isInteger(body.categoryId) && body.categoryId > 0)) {
      throw httpError(400, 'categoryId must be a positive integer or null');
    }
    data.categoryId = body.categoryId;
  }

  if (body.quantityTotal !== undefined) {
    if (!isNonNegInt(body.quantityTotal)) throw httpError(400, 'quantityTotal must be an integer >= 0');
    data.quantityTotal = body.quantityTotal;
  }

  if (body.quantityAvailable !== undefined) {
    if (!isNonNegInt(body.quantityAvailable)) throw httpError(400, 'quantityAvailable must be an integer >= 0');
    data.quantityAvailable = body.quantityAvailable;
  }

  return data;
}

function parsePropertyIds(body) {
  if (body.propertyIds === undefined) return undefined;
  const ids = body.propertyIds;
  if (!Array.isArray(ids) || !ids.every((n) => Number.isInteger(n) && n > 0)) {
    throw httpError(400, 'propertyIds must be an array of positive integers');
  }
  return [...new Set(ids)];
}

// Prisma error codes -> clean HTTP errors
function mapPrismaError(err) {
  if (err.code === 'P2025') return httpError(404, 'Equipment not found');
  if (err.code === 'P2003') return httpError(409, 'Invalid categoryId/propertyId, or equipment is still referenced by other data');
  return err;
}

const equipmentInclude = {
  category: true,
  properties: { include: { property: true } },
};

// shape the response: flatten PropEquip join rows into a plain properties array
function toResponse(e) {
  return {
    ...e,
    properties: e.properties.map((p) => p.property),
  };
}

// READ list
// GET /api/equipment?q=microscope&categoryId=2&available=true&page=1&limit=20
router.get('/', requireAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const where = {};
  if (req.query.q) where.name = { contains: String(req.query.q) };
  if (req.query.categoryId) where.categoryId = parseId(req.query.categoryId);
  if (req.query.available === 'true') where.quantityAvailable = { gt: 0 };

  const [items, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      include: equipmentInclude,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.equipment.count({ where }),
  ]);

  res.json({ items: items.map(toResponse), page, limit, total });
});

// READ one
// GET /api/equipment/:id
router.get('/:id', requireAuth, async (req, res) => {
  const equipmentId = parseId(req.params.id);

  const equipment = await prisma.equipment.findUnique({
    where: { equipmentId },
    include: equipmentInclude,
  });
  if (!equipment) throw httpError(404, 'Equipment not found');

  res.json(toResponse(equipment));
});

// CREATE 
// POST /api/equipment
// body: { name, description?, categoryId?, quantityTotal?, quantityAvailable?, location?, imageUrl?, propertyIds? }
router.post('/', requireAuth, canManage, async (req, res) => {
  const data = buildData(req.body ?? {}, { partial: false });
  const propertyIds = parsePropertyIds(req.body ?? {});

  // default: everything is available when first added
  if (data.quantityTotal === undefined) data.quantityTotal = 0;
  if (data.quantityAvailable === undefined) data.quantityAvailable = data.quantityTotal;

  // schema comment: CHECK (quantity_available <= quantity_total)
  if (data.quantityAvailable > data.quantityTotal) {
    throw httpError(400, 'quantityAvailable cannot exceed quantityTotal');
  }

  try {
    const created = await prisma.equipment.create({
      data: {
        ...data,
        ...(propertyIds && {
          properties: { create: propertyIds.map((propertyId) => ({ propertyId })) },
        }),
      },
      include: equipmentInclude,
    });
    res.status(201).json(toResponse(created));
  } catch (err) {
    throw mapPrismaError(err);
  }
});

// UPDATE 
// PATCH /api/equipment/:id 
// propertyIds, if sent, REPLACES the whole property list
router.patch('/:id', requireAuth, canManage, async (req, res) => {
  const equipmentId = parseId(req.params.id);
  const data = buildData(req.body ?? {}, { partial: true });
  const propertyIds = parsePropertyIds(req.body ?? {});

  const current = await prisma.equipment.findUnique({ where: { equipmentId } });
  if (!current) throw httpError(404, 'Equipment not found');

  // validate the quantity rule against the final merged values
  const total = data.quantityTotal ?? current.quantityTotal;
  const available = data.quantityAvailable ?? current.quantityAvailable;
  if (available > total) {
    throw httpError(400, 'quantityAvailable cannot exceed quantityTotal');
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (propertyIds) {
        await tx.propEquip.deleteMany({ where: { equipmentId } });
        if (propertyIds.length) {
          await tx.propEquip.createMany({
            data: propertyIds.map((propertyId) => ({ equipmentId, propertyId })),
          });
        }
      }
      return tx.equipment.update({
        where: { equipmentId },
        data,
        include: equipmentInclude,
      });
    });
    res.json(toResponse(updated));
  } catch (err) {
    throw mapPrismaError(err);
  }
});

// DELETE
// DELETE /api/equipment/:id
// FKs are ON DELETE RESTRICT, so equipment used by sessions / requests / reservations
// cannot be deleted (returns 409). Property links (prop_equip) are cleaned up first.
router.delete('/:id', requireAuth, canManage, async (req, res) => {
  const equipmentId = parseId(req.params.id);

  try {
    await prisma.$transaction([
      prisma.propEquip.deleteMany({ where: { equipmentId } }),
      prisma.equipment.delete({ where: { equipmentId } }),
    ]);
    res.status(204).end();
  } catch (err) {
    throw mapPrismaError(err);
  }
});

module.exports = router;