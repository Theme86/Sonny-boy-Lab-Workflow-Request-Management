// backend/services/users/validation.js — small input checks shared by the user routes.
// Each throws an Error with a `status`, which the app's error handler turns into the HTTP response.

const NAME_MAX = 100;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function parseUserId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'Invalid user id');
  return id;
}

// Optional text field: "" or null clears it, otherwise trimmed and length-checked.
function cleanOptional(value, label, max, pattern, patternMessage) {
  if (value === null) return null;
  if (typeof value !== 'string') throw httpError(400, `${label} must be text`);
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) throw httpError(400, `${label} must be at most ${max} characters`);
  if (pattern && !pattern.test(trimmed)) throw httpError(400, patternMessage);
  return trimmed;
}

function cleanName(value, label) {
  if (typeof value !== 'string') throw httpError(400, `${label} must be text`);
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw httpError(400, `${label} is required`);
  if (trimmed.length > NAME_MAX) throw httpError(400, `${label} must be at most ${NAME_MAX} characters`);
  return trimmed;
}

module.exports = { httpError, parseUserId, cleanOptional, cleanName };
