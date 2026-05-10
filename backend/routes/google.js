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

// Scopes for Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

/**
 * GET /auth/google/url?userId=...
 * Generates the Google OAuth URL
 */
router.get('/url', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical: ensures we get a refresh_token
    scope: SCOPES,
    state: userId, // Pass userId in state to recover it in callback
    prompt: 'consent' // Force consent to ensure refresh token is sent every time during setup
  });

  res.json({ url });
});

/**
 * GET /auth/google/callback
 * Handles the redirect from Google
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
      console.log(`[Google] Stored refresh token for user ${userId}`);
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

module.exports = router;
