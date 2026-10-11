// backend/utils/validateRequest.js
// Values must match enums in prisma/schema.prisma
const REQUEST_TYPES = [
  'maintenance',
  'access_permission',
  'consumable_order',
  'equipment_reservation',
  'ticket',
];
const REQUEST_STATUSES = [
  'open', 'in_review', 'approved', 'in_progress', 'blocked', 'completed', 'rejected', 'closed',
];

// Types that THIS endpoint can create.
// consumable_order / equipment_reservation need extra detail rows and are
// handled by the consumable / equipment owners.
const SUBMITTABLE_TYPES = ['ticket', 'maintenance', 'access_permission'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent']; // Request.priority is VarChar(10)
const RESOURCE_TYPES = ['room', 'equipment', 'software'];

const LIMITS = { titleMin: 3, titleMax: 150, descMin: 5, descMax: 250 };

// '' / null / undefined -> null (not provided), valid positive int -> number, anything else -> NaN
function toOptionalPositiveInt(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : NaN;
}

function validateRequestInput(body, now = new Date()) {
  const b = body && typeof body === 'object' ? body : {};
  const errors = {};

  const type = typeof b.type === 'string' ? b.type : '';
  if (!type) errors.type = 'Request type is required';
  else if (!SUBMITTABLE_TYPES.includes(type)) errors.type = 'Unsupported request type';

  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) errors.title = 'Title is required';
  else if (title.length < LIMITS.titleMin) errors.title = `Title must be at least ${LIMITS.titleMin} characters`;
  else if (title.length > LIMITS.titleMax) errors.title = `Title must be at most ${LIMITS.titleMax} characters`;

  const description = typeof b.description === 'string' ? b.description.trim() : '';
  if (!description) errors.description = 'Description is required';
  else if (description.length < LIMITS.descMin) errors.description = `Description must be at least ${LIMITS.descMin} characters`;
  else if (description.length > LIMITS.descMax) errors.description = `Description must be at most ${LIMITS.descMax} characters`;

  let priority = 'medium';
  if (b.priority !== undefined && b.priority !== null && b.priority !== '') {
    if (PRIORITIES.includes(b.priority)) priority = b.priority;
    else errors.priority = `Priority must be one of: ${PRIORITIES.join(', ')}`;
  }

  let equipmentId = null;
  let access = null;

  if (type === 'maintenance') {
    equipmentId = toOptionalPositiveInt(b.equipmentId);
    if (Number.isNaN(equipmentId)) {
      errors.equipmentId = 'Equipment ID must be a positive whole number';
      equipmentId = null;
    }
  }

  if (type === 'access_permission') {
    const resourceType = b.resourceType;
    if (!resourceType) errors.resourceType = 'Resource type is required';
    else if (!RESOURCE_TYPES.includes(resourceType)) errors.resourceType = `Resource type must be one of: ${RESOURCE_TYPES.join(', ')}`;

    let resourceId = toOptionalPositiveInt(b.resourceId);
    if (Number.isNaN(resourceId)) {
      errors.resourceId = 'Resource ID must be a positive whole number';
      resourceId = null;
    }

    let expiresAt = null;
    if (b.expiresAt) {
      const d = new Date(b.expiresAt);
      if (Number.isNaN(d.getTime())) errors.expiresAt = 'Expiry date is not valid';
      else if (d <= now) errors.expiresAt = 'Expiry date must be in the future';
      else expiresAt = d;
    }

    if (!errors.resourceType) access = { resourceType, resourceId, expiresAt };
  }

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, data: ok ? { type, title, description, priority, equipmentId, access } : null };
}

module.exports = {
  validateRequestInput,
  REQUEST_TYPES,
  REQUEST_STATUSES,
  SUBMITTABLE_TYPES,
  PRIORITIES,
  RESOURCE_TYPES,
  LIMITS,
};
