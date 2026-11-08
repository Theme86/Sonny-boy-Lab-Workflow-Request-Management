// backend/utils/validateConsumable.js
// Checks the body of POST / PUT /api/consumables. Limits follow the columns in prisma/schema.prisma
// and the same rules as the add/edit form in the frontend (lib/consumableForm.ts).
const UNITS = ['ml', 'l', 'g', 'kg', 'pieces'];

const LIMITS = {
  nameMax: 150,
  descMax: 250,
  imageUrlMax: 500,
  phMin: 0,
  phMax: 14,
  quantityMax: 99999999.99, // Decimal(10, 2)
};

const isBlank = (v) => v === undefined || v === null || v === '';

function checkName(v) {
  const name = typeof v === 'string' ? v.trim() : '';
  if (!name) return { error: 'Name is required' };
  if (name.length > LIMITS.nameMax) return { error: `Name must be at most ${LIMITS.nameMax} characters` };
  return { value: name };
}

function checkUnit(v, allowedUnits) {
  if (isBlank(v)) return { error: 'Unit is required' };
  if (!allowedUnits.includes(v)) return { error: `Unit must be one of: ${UNITS.join(', ')}` };
  return { value: v };
}

function checkQuantity(v, label) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return { error: `${label} must be a number` };
  if (n < 0) return { error: `${label} must be 0 or more` };
  if (n > LIMITS.quantityMax) return { error: `${label} is too large` };
  return { value: n };
}

function checkOptionalText(v, label, max) {
  if (isBlank(v)) return { value: null };
  if (typeof v !== 'string') return { error: `${label} must be text` };
  const text = v.trim();
  if (text.length > max) return { error: `${label} must be at most ${max} characters` };
  return { value: text || null };
}

function checkPh(v) {
  if (isBlank(v)) return { value: null };
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < LIMITS.phMin || n > LIMITS.phMax) {
    return { error: `pH must be between ${LIMITS.phMin} and ${LIMITS.phMax}` };
  }
  return { value: n };
}

function checkDate(v) {
  if (isBlank(v)) return { value: null };
  const d = typeof v === 'string' ? new Date(v) : null;
  if (!d || Number.isNaN(d.getTime())) return { error: 'Expiry date is not a valid date' };
  return { value: d };
}

// a web address, or a path to a photo uploaded to this server (e.g. /consumableImages/3/photo.png)
function checkImageUrl(v) {
  const result = checkOptionalText(v, 'Image URL', LIMITS.imageUrlMax);
  if (result.value && !/^(https?:\/\/|\/)/i.test(result.value)) {
    return { error: 'Image URL must start with http://, https:// or /' };
  }
  return result;
}

// Optional fields and the value a new consumable gets when the field is left out.
const OPTIONAL = {
  currentStock: { check: (v) => checkQuantity(v, 'Current stock'), fallback: 0 },
  reorderThreshold: { check: (v) => checkQuantity(v, 'Reorder threshold'), fallback: 0 },
  description: { check: (v) => checkOptionalText(v, 'Description', LIMITS.descMax), fallback: null },
  phValue: { check: checkPh, fallback: null },
  expiryDate: { check: checkDate, fallback: null },
  imageUrl: { check: checkImageUrl, fallback: null },
};

/**
 * partial: true for PUT — only the fields in the body are checked and returned.
 * extraUnits: units allowed besides UNITS, e.g. an old item's current unit so it can still be edited.
 * Returns { ok, errors, data } where errors maps field name -> message.
 */
function validateConsumableInput(body, { partial = false, extraUnits = [] } = {}) {
  const b = body && typeof body === 'object' ? body : {};
  const checks = {
    name: checkName,
    unit: (v) => checkUnit(v, [...UNITS, ...extraUnits]),
    ...Object.fromEntries(Object.entries(OPTIONAL).map(([field, { check }]) => [field, check])),
  };

  const errors = {};
  const data = {};
  for (const [field, check] of Object.entries(checks)) {
    const given = b[field] !== undefined;
    if (!given && partial) continue;
    if (!given && OPTIONAL[field]) {
      data[field] = OPTIONAL[field].fallback;
      continue;
    }
    const { value, error } = check(b[field]);
    if (error) errors[field] = error;
    else data[field] = value;
  }

  const ok = Object.keys(errors).length === 0;
  return { ok, errors, data: ok ? data : null };
}

module.exports = { validateConsumableInput, UNITS, LIMITS };
