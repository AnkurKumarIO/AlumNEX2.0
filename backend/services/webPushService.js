const webpush = require('web-push');
const prisma = require('../lib/prisma');

// Configure VAPID only if keys are present
const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

let pushEnabled = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:alumnex@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  pushEnabled = true;
  console.log('🔔 Web Push Service initialized');
} else {
  console.warn('⚠️  Web Push: VAPID keys not set — push notifications disabled');
}

/**
 * Send a web push notification to all subscriptions of a given user.
 * Silently removes expired/invalid subscriptions.
 */
async function sendPushToUser(userId, { title, message, url = '/', icon = '/favicon.png' }) {
  if (!pushEnabled) return;

  let subscriptions;
  try {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: userId },
    });
  } catch (err) {
    console.error('[WebPush] DB lookup failed:', err.message);
    return;
  }

  if (!subscriptions.length) return;

  const payload = JSON.stringify({ title, message, url, icon });

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  // Clean up stale subscriptions (410 Gone or 404)
  const staleEndpoints = [];
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        staleEndpoints.push(subscriptions[i].endpoint);
      } else {
        console.warn(`[WebPush] Send failed for user ${userId}:`, result.reason?.message);
      }
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    }).catch(() => {});
  }
}

module.exports = { sendPushToUser, pushEnabled, VAPID_PUBLIC_KEY };
