// utils/restrictedAccessLog.js — who opened a restricted request, and when (SRS-17).
// Pass `db` = prisma, or the tx of a running transaction.
async function logRestrictedAccess(db, requestId, userId) {
  await db.restrictedAccessLog.create({ data: { requestId, userId } });
}

module.exports = { logRestrictedAccess };