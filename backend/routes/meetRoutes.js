const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const {
  createGoogleMeetLink,
  generateJitsiFallback,
  isValidMeetUrl,
  meetLinksCache,
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
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80',  username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
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

/**
 * POST /meet/create
 * Creates a video call link for an interview session.
 * 
 * Flow:
 * 1. If alumniId is provided, look up their google_refresh_token
 * 2. If they have a token → create a real Google Meet link (alumni = Host)
 * 3. If not → fallback to Jitsi Meet (still works, no waiting room)
 * 
 * Body: { roomId, title, alumniId, startTime, endTime }
 */
router.post('/create', async (req, res) => {
  try {
    const { roomId, title, alumniId, startTime, endTime } = req.body;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId is required' });

    // Check cache first
    if (meetLinksCache[roomId]) {
      return res.json({
        success: true,
        meetLink: meetLinksCache[roomId],
        roomId,
        title: title || `AlumNEX Interview - Room ${roomId}`,
        isGoogleMeet: meetLinksCache[roomId].includes('meet.google.com'),
        source: 'cache',
        createdAt: new Date().toISOString(),
      });
    }

    let meetLink = null;

    // Try to create a real Google Meet link using the alumni's OAuth token
    if (alumniId) {
      try {
        const alumni = await prisma.user.findUnique({
          where: { id: alumniId },
          select: { google_refresh_token: true, name: true },
        });

        if (alumni?.google_refresh_token) {
          meetLink = await createGoogleMeetLink(
            alumni.google_refresh_token,
            roomId,
            title || `AlumNEX Interview - Room ${roomId}`,
            startTime,
            endTime
          );
          console.log(`[Meet] Created Google Meet for alumni ${alumni.name}: ${meetLink}`);
        } else {
          console.log(`[Meet] Alumni ${alumniId} has no Google token — using Jitsi fallback`);
        }
      } catch (err) {
        console.error(`[Meet] Google Meet creation failed for alumni ${alumniId}:`, err.message);
      }
    }

    // Fallback to Jitsi
    if (!meetLink) {
      meetLink = generateJitsiFallback(roomId);
      meetLinksCache[roomId] = meetLink;
      console.log(`[Meet] Generated Jitsi fallback for room ${roomId}: ${meetLink}`);
    }

    res.json({
      success: true,
      meetLink,
      roomId,
      title: title || `AlumNEX Interview - Room ${roomId}`,
      isGoogleMeet: meetLink.includes('meet.google.com'),
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Meet] Create error:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/** POST /meet/custom */
router.post('/custom', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'code is required' });
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

/**
 * GET /meet/:roomId — wildcard, MUST be last
 * Returns the meet link for a given room. Checks:
 * 1. In-memory cache
 * 2. Database (room_id field in InterviewRequest)
 * 3. Falls back to Jitsi
 */
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;

    // 1. Check cache
    if (meetLinksCache[roomId]) {
      return res.json({
        success: true,
        meetLink: meetLinksCache[roomId],
        roomId,
        source: 'cache',
        retrievedAt: new Date().toISOString(),
      });
    }

    // 2. Check database — room_id might be a stored URL
    let meetLink = null;
    try {
      const request = await prisma.interviewRequest.findFirst({
        where: {
          OR: [
            { request_id: roomId },
            { room_id: roomId },
          ],
        },
        include: {
          alumni: { select: { google_refresh_token: true, name: true } },
        },
      });

      if (request?.room_id?.startsWith('http')) {
        meetLink = request.room_id;
        meetLinksCache[roomId] = meetLink;
      } else if (request?.alumni?.google_refresh_token) {
        // Alumni has Google connected — try creating a Meet link on-demand
        try {
          meetLink = await createGoogleMeetLink(
            request.alumni.google_refresh_token,
            roomId,
            `AlumNEX Interview`
          );
        } catch (err) {
          console.error(`[Meet] On-demand Google Meet failed:`, err.message);
        }
      }
    } catch (dbErr) {
      console.error('[Meet] DB lookup error:', dbErr.message);
    }

    // 3. Fallback to Jitsi
    if (!meetLink) {
      meetLink = generateJitsiFallback(roomId);
      meetLinksCache[roomId] = meetLink;
    }

    res.json({
      success: true,
      meetLink,
      roomId,
      retrievedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error(`[Meet] Get room error:`, e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
