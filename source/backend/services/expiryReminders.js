// services/expiryReminders.js — reminds lecturers and lab managers about consumables that expire soon or have expired.
// Expiry happens just because time passes, so this runs on a timer instead of after a request.
const { expiryState, EXPIRY_WARNING_DAYS } = require('./dashboard/stockHelpers');
const { approverIds, notifyUsers } = require('../utils/notify');

// same window as the dashboard and the "Expiring ≤ 30 days" card on the consumables page
const EXPIRY_NOTICE_DAYS = EXPIRY_WARNING_DAYS;
const CHECK_EVERY_MS = 60 * 60 * 1000; // hourly; each reminder is still sent only once

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

// The text doubles as the "already sent" key, so it must not change from day to day
// (no "in 12 days"). A new expiry date or name gives a new text and so a new reminder.
function reminderMessage(c, state) {
  return state === 'expired'
    ? `${c.name} has expired (${formatDate(c.expiryDate)})`
    : `${c.name} expires soon, on ${formatDate(c.expiryDate)}`;
}

/** Sends the reminders that are due and not sent yet. Returns how many consumables got a new reminder. */
async function sendExpiryReminders(prisma, now = new Date()) {
  const latest = new Date(now.getTime() + EXPIRY_NOTICE_DAYS * 24 * 60 * 60 * 1000);
  const items = await prisma.consumable.findMany({
    where: { expiryDate: { not: null, lte: latest } },
    select: { consumableId: true, name: true, expiryDate: true },
  });

  let sent = 0;
  for (const c of items) {
    const state = expiryState(c.expiryDate, now, EXPIRY_NOTICE_DAYS);
    if (!state) continue;
    const message = reminderMessage(c, state);
    const already = await prisma.notification.findFirst({
      where: { consumableId: c.consumableId, notifType: 'reminder', message },
      select: { notificationId: true },
    });
    if (already) continue;
    // nobody to leave out: the system sends this, not a person
    await notifyUsers(prisma, await approverIds(prisma, 0), { target: { consumableId: c.consumableId }, message, notifType: 'reminder' });
    sent++;
  }
  return sent;
}

/** Runs the check now and then every hour while the server is up. */
function startExpiryReminders(prisma) {
  const run = () =>
    sendExpiryReminders(prisma)
      .then((sent) => sent && console.log(`Expiry reminders sent for ${sent} consumable(s)`))
      .catch((err) => console.error('Expiry reminder check failed:', err.message));
  run();
  setInterval(run, CHECK_EVERY_MS).unref(); // unref: the timer alone does not keep Node running
}

module.exports = { EXPIRY_NOTICE_DAYS, reminderMessage, sendExpiryReminders, startExpiryReminders };
