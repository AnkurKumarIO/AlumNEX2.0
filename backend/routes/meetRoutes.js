const express = require('express');
const router = express.Router();
const {
  generateMeetLink,
  isValidMeetUrl,
} = require('../services/googleMeetService');

/**
 * GET /meet/ice-config
 * Returns ICE servers. Uses Metered API if configured (best),
 * otherwise uses multiple reliable free TURN servers (works cross-network).
 * MUST be before /:roomId wildcard.
 */
router.get('/ice-config', async (req, res) => {
  try {
    const apiKey  = process.env.METERED_API_KEY;
    const appName = process.env.METERED_APP_NAME;

    if (apiKey && appName) {
      const response = await fetch(`https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`);
      if (response.ok) {
        const iceServers = await response.json();
        return res.json({ iceServers, iceCandidatePoolSize: 10 });
      }
    }

    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
      ],
      iceCandidatePoolSize: 10,
    });
  } catch (e) {
    res.json({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      iceCandidatePoolSize: 10,
    });
  }
});

/** POST /meet/create */
router.post('/create', async (req, res) => {
  try {
    const { roomId, title } = req.body;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId is required' });
    const meetLink = await generateMeetLink(roomId, title);
    res.json({ success: true, meetLink, roomId, title: title || `AlumNEX Interview - Room ${roomId}`, createdAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/custom */
router.post('/custom', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    // For custom codes, just append to meet.google.com
    const sanitizedCode = code.replace(/[^a-zA-Z0-9-]/g, '');
    res.json({ success: true, meetLink: `https://meet.google.com/${sanitizedCode}`, code, createdAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/validate */
router.post('/validate', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'url is required' });
    res.json({ success: true, isValid: isValidMeetUrl(url), url });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** GET /meet/:roomId — wildcard, MUST be last */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const meetLink = await generateMeetLink(roomId);
    res.json({ success: true, meetLink, roomId, retrievedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
