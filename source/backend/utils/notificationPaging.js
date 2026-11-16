// utils/notificationPaging.js — the where clause of the list and the cursor paging of its result.

// only the logged-in user's rows; each filter is used only when the client sent it
function listWhere(userId, q) {
  return {
    userId,
    isRead: q.isRead === undefined ? undefined : q.isRead === "true",
    notifType: q.notifType,
    notificationId: q.before ? { lt: q.before } : undefined,
  };
}

// rows holds one extra row (take: limit + 1); its presence tells us there is a next page
function toPage(rows, limit) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].notificationId : null };
}

module.exports = { listWhere, toPage };