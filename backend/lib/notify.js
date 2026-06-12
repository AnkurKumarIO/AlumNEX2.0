const prisma = require('./prisma');
const { sendPushToUser } = require('../services/webPushService');

/**
 * Creates a notification in the DB and fires a web push to the user.
 *
 * Usage (drop-in replacement for prisma.notification.create):
 *   const notif = await notify({ user_id, type, title, message, request_id, room_id });
 *
 * The optional `url` param lets you deep-link the push click to a specific page.
 * Defaults to '/' which the service worker will open on click.
 */
async function notify(data, { url } = {}) {
  // 1. Persist to DB (same as before)
  const notif = await prisma.notification.create({ data });

  // 2. Fire web push (non-blocking — failure never throws)
  const pushUrl = url || buildUrl(data.type, data.request_id);
  sendPushToUser(data.user_id, {
    title: data.title,
    message: data.message,
    url: pushUrl,
  }).catch(() => {}); // never block the main flow

  return notif;
}

/** Map notification type → a sensible deep-link path */
function buildUrl(type, requestId) {
  switch (type) {
    case 'NEW_REQUEST':
    case 'SLOT_REQUESTED':
    case 'SLOT_BOOKED':
    case 'SLOT_BOOKED_ALUMNI':
    case 'ACCEPTED':
    case 'DECLINED':
    case 'PROMOTED':
    case 'WAITING':
      return '/dashboard';
    case 'LIVE':
    case 'LIVE_ALUMNI':
    case 'REMINDER':
      return requestId ? `/interview/${requestId}` : '/dashboard';
    default:
      return '/dashboard';
  }
}

module.exports = { notify };
