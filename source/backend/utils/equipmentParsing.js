// utils/equipmentParsing.js — turns request values into safe numbers and lists.
const { httpError } = require('./equipmentErrors');

// The quantity columns are MySQL INT, so a larger number would fail inside the database with a 500.
const INT_MAX = 2147483647;

function parseId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw httpError(400, 'Invalid id');
  return n;
}

// A whole number from 1 to max; anything else (abc, 1.5, 0, -3) falls back to the default.
function parseWholeNumber(value, fallback, max) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, max) : fallback;
}

function isNonNegInt(v) {
  return Number.isInteger(v) && v >= 0 && v <= INT_MAX;
}

function parsePropertyIds(body) {
  if (body.propertyIds === undefined) return undefined;
  const ids = body.propertyIds;
  if (!Array.isArray(ids) || !ids.every((n) => Number.isInteger(n) && n > 0)) {
    throw httpError(400, 'propertyIds must be an array of positive integers');
  }
  return [...new Set(ids)];
}

module.exports = { INT_MAX, parseId, parseWholeNumber, isNonNegInt, parsePropertyIds };