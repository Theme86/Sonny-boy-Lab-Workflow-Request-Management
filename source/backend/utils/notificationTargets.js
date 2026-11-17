// utils/notificationTargets.js — checks that the user, request and lab session of a new notification exist,
// so the client gets a clear 404 instead of a foreign-key error.
const { prisma } = require("../lib/prisma");
const { HttpError } = require("../middleware/helpers");

async function assertExists(model, where, select, message) {
  const found = await prisma[model].findUnique({ where, select });
  if (!found) throw new HttpError(404, message);
}

async function assertTargetsExist(data) {
  await assertExists("user", { userId: data.userId }, { userId: true }, "User not found");
  if (data.requestId != null) {
    await assertExists("request", { requestId: data.requestId }, { requestId: true }, "Request not found");
  }
  if (data.labSessionId != null) {
    await assertExists("labSession", { labSessionId: data.labSessionId }, { labSessionId: true }, "Lab session not found");
  }
}

module.exports = { assertTargetsExist };