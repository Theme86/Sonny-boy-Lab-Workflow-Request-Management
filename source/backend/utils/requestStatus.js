const STAFF_ROLES = ['ta', 'lecturer', 'lab_manager'];
const isStaff = (role) => STAFF_ROLES.includes(role);

// current status -> statuses it may move to
const STATUS_FLOW = {
  open: ['in_review', 'in_progress', 'rejected'],
  in_review: ['approved', 'in_progress', 'blocked', 'rejected'],
  approved: ['in_progress', 'completed', 'blocked'],
  in_progress: ['completed', 'blocked'],
  blocked: ['in_progress', 'in_review', 'rejected'],
  completed: ['closed', 'in_progress'],
  rejected: ['closed', 'in_review'],
  closed: [], 
};

const nextStatuses = (status) => STATUS_FLOW[status] ?? [];
const canTransition = (from, to) => nextStatuses(from).includes(to);

// What the person is allowed to pick right now (nothing for members)
const allowedStatusesFor = (status, role) => (isStaff(role) ? nextStatuses(status) : []);

const humanize = (status) => String(status).replace(/_/g, ' ');

module.exports = { STAFF_ROLES, isStaff, STATUS_FLOW, nextStatuses, canTransition, allowedStatusesFor, humanize };
