// services/dashboard/inventory.js — consumables and equipment, read-only. Every logged-in user may see these.
const { consumableSummary } = require('./consumables');
const { equipmentSummary } = require('./equipment');

module.exports = { consumableSummary, equipmentSummary };
