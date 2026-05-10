const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const prisma = require('../lib/prisma');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/auth/google/callback` 
    : 'http://localhost:5001/auth/google/callback'
);

// Scopes for Google Calendar (required to create Meet links)
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * GET /auth/google/url?userId=...
 * Generates the Google OAuth URL — alumni clicks this to connect their calendar
 */
router.get('/url', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical: ensures we get a refresh_token
    scope: SCOPES,
    state: userId, // Pass userId in state to recover it in callback
    prompt: 'consent' // Force consent to ensure refresh token is sent every time
  });

  res.json({ url });
});

/**
 * GET /auth/google/callback
 * Handles the redirect from Google after alumni grants permission
 */
router.get('/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  if (!code || !userId) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?google_status=error`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // We only care about the refresh_token because it lasts forever
    if (tokens.refresh_token) {
      await prisma.user.update({
        where: { id: userId },
        data: { google_refresh_token: tokens.refresh_token }
      });
      console.log(`[Google] ✅ Stored refresh token for user ${userId}`);
    } else {
      console.warn(`[Google] No refresh token returned for user ${userId}. This usually happens if the user already authorized the app. Use prompt:consent.`);
    }

    // Redirect back to frontend settings page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?google_status=success`);
  } catch (err) {
    console.error('[Google] OAuth Callback Error:', err.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?google_status=error&message=${encodeURIComponent(err.message)}`);
  }
});

/**
 * GET /auth/google/status?userId=...
 * Checks if the alumni has connected their Google Calendar
 * Returns { connected: true/false, email?: string }
 */
router.get('/status', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { google_refresh_token: true, email: true },
    });

    if (!user) return res.json({ connected: false });

    if (user.google_refresh_token) {
      // Optionally verify the token is still valid by trying to get user info
      try {
        const client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        client.setCredentials({ refresh_token: user.google_refresh_token });
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const userInfo = await oauth2.userinfo.get();
        return res.json({ 
          connected: true, 
          googleEmail: userInfo.data.email,
          userEmail: user.email,
        });
      } catch (tokenErr) {
        // Token is expired or revoked
        console.warn(`[Google] Token validation failed for ${userId}:`, tokenErr.message);
        return res.json({ connected: true, googleEmail: null, tokenMayBeExpired: true });
      }
    }

    res.json({ connected: false });
  } catch (err) {
    console.error('[Google] Status check error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /auth/google/disconnect
 * Removes the alumni's stored Google refresh token
 * Body: { userId }
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    await prisma.user.update({
      where: { id: userId },
      data: { google_refresh_token: null },
    });

    console.log(`[Google] Disconnected Google Calendar for user ${userId}`);
    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (err) {
    console.error('[Google] Disconnect error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
