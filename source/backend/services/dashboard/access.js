// services/dashboard/access.js — who may see which part of the dashboard.
// The rules mirror the existing routes, so the dashboard never shows more than the pages behind it do:
//   - requests: ta, lecturer and lab_manager work on everyone's requests (utils/requestStatus.js)
//   - sessions: only lecturer and lab_manager approve them (routes/labSessionRoutes.js)
//   - users and roles: lab_manager only (routes/userRoutes.js)
const { isStaff } = require('../../utils/requestStatus');

const SESSION_APPROVER_ROLES = ['lecturer', 'lab_manager'];

/** Which "needs attention" items a role gets. Everything else on the dashboard is visible to all. */
function attentionAccess(role) {
  return {
    requests: isStaff(role),
    pendingSessions: SESSION_APPROVER_ROLES.includes(role),
    newMembers: role === 'lab_manager',
  };
}

/** True when the role gets at least one needs-attention item. */
const hasAttention = (role) => Object.values(attentionAccess(role)).some(Boolean);

module.exports = { SESSION_APPROVER_ROLES, attentionAccess, hasAttention };
