// utils/notificationInclude.js — small related info so the frontend can show a title and link to the target.
const include = {
  request: { select: { requestId: true, title: true, status: true } },
  session: { select: { labSessionId: true, name: true, status: true } },
  consumable: { select: { consumableId: true, name: true } },
};

module.exports = { include };