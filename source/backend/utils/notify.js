// utils/notify.js — creates notification rows (the bell and the dashboard read them).
// Every function takes `db`: pass the `tx` of a running transaction so the notification is
// saved together with the change that caused it (both happen, or neither).

// Lecturers and lab managers are the people asked to approve / review things.
const APPROVER_ROLES = ['lecturer', 'lab_manager'];

// notifications.message is VARCHAR(255)
const MAX_MESSAGE = 255;

/** Keeps a message inside the column size (a long title would otherwise make the insert fail). */
function fit(text) {
  return text.length <= MAX_MESSAGE ? text : `${text.slice(0, MAX_MESSAGE - 1)}…`;
}

/**
 * Ids of the active lecturers and lab managers, without the person who did the action
 * (nobody needs a bell message about something they just did themselves).
 */
async function approverIds(db, exceptUserId) {
  const rows = await db.user.findMany({
    where: { active: true, role: { in: APPROVER_ROLES }, userId: { not: exceptUserId } },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

/**
 * One notification for each user in `userIds`.
 * `target` is { requestId } or { labSessionId }: the table needs exactly one of them.
 */
async function notifyUsers(db, userIds, { target, message, notifType }) {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;
  await db.notification.createMany({
    data: ids.map((userId) => ({ userId, ...target, message: fit(message), notifType })),
  });
}

module.exports = { APPROVER_ROLES, MAX_MESSAGE, fit, approverIds, notifyUsers };