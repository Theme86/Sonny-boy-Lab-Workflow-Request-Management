// utils/equipmentSort.js — the allowed sort orders for the list.
// The client sends a key, never a field name, so only these can be used.
// name is the tie-breaker, so the order is the same every time and paging stays stable.
const SORT_OPTIONS = {
  name: [{ name: 'asc' }],
  name_desc: [{ name: 'desc' }],
  available_low: [{ quantityAvailable: 'asc' }, { name: 'asc' }],
  available_high: [{ quantityAvailable: 'desc' }, { name: 'asc' }],
  location: [{ location: 'asc' }, { name: 'asc' }],
};
 
// only a known key picks the order; anything else (even "constructor") falls back to name
function sortOrder(sort) {
  const sortKey = String(sort);
  return Object.hasOwn(SORT_OPTIONS, sortKey) ? SORT_OPTIONS[sortKey] : SORT_OPTIONS.name;
}
 
module.exports = { sortOrder };