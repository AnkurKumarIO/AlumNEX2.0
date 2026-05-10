const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const {
  createGoogleMeetLink,
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
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
      const response = await fetch(
        `https://${appName}.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`
      );
      if (response.ok) {
        const iceServers = await response.json();
        return res.json({ iceServers, iceCandidatePoolSize: 10 });
      }
    }

    res.json({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
      ],
      iceCandidatePoolSize: 10,
    });
  } catch (e) {
    console.error('[ICE] Error:', e.message);
    res.json({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      iceCandidatePoolSize: 10,
    });
  }
});

/** POST /meet/create */
router.post('/create', async (req, res) => {
  try {
    const { roomId, title, alumniId, startTime, endTime } = req.body;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId is required' });

    let meetLink = null;

    if (alumniId) {
      const alumni = await prisma.user.findUnique({
        where: { id: alumniId },
        select: { google_refresh_token: true }
      });

      if (alumni?.google_refresh_token) {
        try {
          meetLink = await createGoogleMeetLink(
            alumni.google_refresh_token,
            title || `AlumNEX Interview - Room ${roomId}`,
            startTime,
            endTime
          );
        } catch (err) {
          console.error(`[Meet] Google Meet creation failed:`, err.message);
        }
      }
    }

    if (!meetLink) {
      meetLink = generateConsistentMeetLink(roomId);
    }

    res.json({ 
      success: true, 
      meetLink, 
      roomId, 
      title: title || `AlumNEX Interview - Room ${roomId}`, 
      isGoogleMeet: meetLink.includes('meet.google.com'),
      createdAt: new Date().toISOString() 
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/custom */
router.post('/custom', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
    res.json({ success: true, meetLink: createMeetLinkWithCode(code), code, createdAt: new Date().toISOString() });
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

/** GET /meet/:roomId */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // Try to find if this roomId is actually a requestId or matches a stored room_id in DB
    const request = await prisma.interviewRequest.findFirst({
      where: {
        OR: [
          { request_id: roomId },
          { room_id: roomId }
        ]
      }
    });

    let meetLink = null;
    if (request?.room_id) {
      // If stored room_id is already a URL, use it
      if (request.room_id.startsWith('http')) {
        meetLink = request.room_id;
      }
    }

    if (!meetLink) {
      meetLink = generateConsistentMeetLink(roomId);
    }

    res.json({ 
      success: true, 
      meetLink, 
      roomId, 
      retrievedAt: new Date().toISOString() 
    });
  } catch (e) {
    console.error(`[Meet] Get room error:`, e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
