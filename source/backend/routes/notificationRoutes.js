// routes/notificationRoutes.js — /api/notifications. Every route works on the logged-in user's own notifications.
// The order matters: the fixed paths (/unread-count, /read-all, DELETE /read) come before /:id.
const { Router } = require("express");
 
const router = Router();
 
router.use(require("./notificationListRoutes"));
router.use(require("./notificationBulkRoutes"));
router.use(require("./notificationCreateRoutes"));
router.use(require("./notificationItemRoutes"));
router.use(require("./notificationUpdateRoutes"));
router.use(require("./notificationDeleteRoutes"));
 
module.exports = router;