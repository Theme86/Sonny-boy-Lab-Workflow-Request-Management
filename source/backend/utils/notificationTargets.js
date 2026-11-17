// utils/notificationTargets.js — checks that the user, request and lab session of a new notification exist,
// so the client gets a clear 404 instead of a foreign-key error.
// A restricted industry-collaboration request (SRS-16) is also guarded: the reply and the bell show the
// request title, so neither the person creating the notification nor the person receiving it may be
// someone who cannot see that request.
const { prisma } = require("../lib/prisma");
const { HttpError } = require("../middleware/helpers");
const { RESTRICTED_MESSAGE, isRestricted, canView } = require("./requestVisibility");

async function assertExists(model, where, select, message) {
  const found = await prisma[model].findUnique({ where, select });
  if (!found) throw new HttpError(404, message);
  return found;
}

async function assertRequestVisible(requestId, actor, recipient) {
  const request = await assertExists(
    "request",
    { requestId },
    {
      requestId: true,
      requesterId: true,
      assignedTo: true,
      industryDetail: { select: { confidentiality: true } },
    },
    "Request not found"
  );
  if (!isRestricted(request)) return;
  if (!canView(actor, request)) throw new HttpError(403, RESTRICTED_MESSAGE);
  if (!canView(recipient, request)) throw new HttpError(403, "That person cannot see this restricted request");
}

/** `actor` = req.user (who is creating the notification). */
async function assertTargetsExist(data, actor) {
  const user = await assertExists("user", { userId: data.userId }, { userId: true, role: true }, "User not found");
  if (data.requestId != null) await assertRequestVisible(data.requestId, actor, user);
  if (data.labSessionId != null) {
    await assertExists("labSession", { labSessionId: data.labSessionId }, { labSessionId: true }, "Lab session not found");
  }
}

module.exports = { assertTargetsExist };