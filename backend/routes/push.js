const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../lib/authMiddleware');
const { VAPID_PUBLIC_KEY } = require('../services/webPushService');

// GET /push/vapid-public-key — frontend fetches this to subscribe
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /push/subscribe — save a new push subscription for a user
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;
    const userId = req.user.userId;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    // Upsert: update keys if endpoint already exists, else create
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent || null,
      },
      create: {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent || null,
      },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Push] Subscribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /push/unsubscribe — remove a subscription
router.delete('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'endpoint required' });

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, user_id: req.user.userId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Push] Unsubscribe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
