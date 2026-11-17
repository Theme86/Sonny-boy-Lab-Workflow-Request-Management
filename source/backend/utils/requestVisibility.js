// utils/requestVisibility.js — who may see a request (US-8, SRS-16).
// One file on purpose: every place that reads requests uses these helpers, so a "restricted"
// industry-collaboration request cannot leak through a read that someone forgot.
//
// Rule: a request whose confidentiality is "restricted" may only be seen by
//   - the person who submitted it,
//   - the staff member it is assigned to,
//   - the Lab Manager.
// Every other request keeps the old rule (members: their own; TA / lecturer / lab manager: all).
const { isStaff } = require('./requestStatus');

const RESTRICTED = 'restricted';

const RESTRICTED_MESSAGE =
  'Access restricted. Only the requester, the assigned staff member and the Lab Manager can view this request.';

/** True when the request (loaded with its industryDetail) is marked "restricted". */
const isRestricted = (request) => request?.industryDetail?.confidentiality === RESTRICTED;

/** May this user open this request? (Non-restricted requests: the old rules still apply in the route.) */
function canView(user, request) {
  if (!isRestricted(request)) return true;
  return user.role === 'lab_manager' || request.requesterId === user.userId || request.assignedTo === user.userId;
}

/**
 * Prisma "where" part for the requests this user may see in a list or a count.
 * `null` means "no extra rule" (the Lab Manager, and members, who are already limited to their own).
 */
function visibleWhere(user) {
  if (user.role === 'lab_manager' || !isStaff(user.role)) return null;
  return {
    OR: [
      { NOT: { industryDetail: { is: { confidentiality: RESTRICTED } } } },
      { requesterId: user.userId },
      { assignedTo: user.userId },
    ],
  };
}

/** Adds the visibility rule to a "where" object without changing the keys already in it. */
function withVisibility(where, user) {
  const extra = visibleWhere(user);
  return extra ? { ...where, AND: [...(where.AND ?? []), extra] } : where;
}

module.exports = { RESTRICTED, RESTRICTED_MESSAGE, isRestricted, canView, visibleWhere, withVisibility };