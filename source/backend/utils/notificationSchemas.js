// utils/notificationSchemas.js — what the notification routes accept: the allowed types, the body of a new
// notification, the body of an update and the list query.
const { z } = require("zod");

const NOTIF_TYPES = ["status_change", "approval_needed", "new_comment", "reminder", "low_stock"];

const createSchema = z
  .object({
    userId: z.number().int().positive(),
    requestId: z.number().int().positive().nullish(),
    labSessionId: z.number().int().positive().nullish(),
    message: z.string().min(1).max(255),
    notifType: z.enum(NOTIF_TYPES).nullish(),
  })
  // DB rule: exactly one of request_id / lab_session_id
  .refine((d) => (d.requestId != null) !== (d.labSessionId != null), {
    message: "Provide exactly one of requestId or labSessionId",
    path: ["requestId"],
  });

const updateSchema = z.object({ isRead: z.boolean() });

const listQuery = z.object({
  isRead: z.enum(["true", "false"]).optional(),
  notifType: z.enum(NOTIF_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  before: z.coerce.number().int().positive().optional(), // cursor: notificationId
});

module.exports = { NOTIF_TYPES, createSchema, updateSchema, listQuery };