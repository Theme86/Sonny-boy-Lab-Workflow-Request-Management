// utils/equipmentAccess.js — who may create / edit / delete equipment: a lab manager.
// requireActiveUser re-reads the role from the database, so a demoted or disabled manager loses access
// at once (the login token alone stays valid for up to an hour). Always use it after requireAuth.
const { requireActiveUser, requireRole } = require('../middleware/auth');
 
const canManage = [requireActiveUser, requireRole('lab_manager')];
 
module.exports = { canManage };