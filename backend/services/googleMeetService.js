const { google } = require('googleapis');

/**
 * Google Meet Service — OAuth-based (Option A)
 * 
 * Creates real Google Meet links using the ALUMNI's OAuth refresh token.
 * The alumni is the meeting host, so they can admit students directly.
 * Falls back to Jitsi Meet if the alumni hasn't connected Google Calendar.
 */

// In-memory cache: roomId -> meetLink (so all users get the same link)
const meetLinksCache = {};

/**
 * Build an OAuth2 client with the app's credentials.
 */
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.BACKEND_URL
      ? `${process.env.BACKEND_URL}/auth/google/callback`
      : 'http://localhost:5001/auth/google/callback'
  );
}

/**
 * Creates a REAL Google Meet link using the alumni's stored refresh token.
 * The alumni becomes the Host of the meeting → can admit students.
 * 
 * @param {string} refreshToken - Alumni's Google OAuth refresh token
 * @param {string} roomId       - Unique room/request ID (for caching)
 * @param {string} title        - Meeting title
 * @param {string} startTime    - ISO string for meeting start (optional)
 * @param {string} endTime      - ISO string for meeting end (optional)
 * @returns {Promise<string>}   The Google Meet URL (e.g. https://meet.google.com/abc-defg-hij)
 */
async function createGoogleMeetLink(refreshToken, roomId, title, startTime, endTime) {
  // Return cached link if we already generated one for this room
  if (roomId && meetLinksCache[roomId]) {
    console.log(`[GoogleMeet] Cache hit for room ${roomId}`);
    return meetLinksCache[roomId];
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const now = new Date();
  const event = {
    summary: title || 'AlumNEX Mock Interview',
    description: `Interview session via AlumNEX Platform.\nRoom: ${roomId || 'N/A'}`,
    start: { dateTime: startTime || now.toISOString() },
    end:   { dateTime: endTime   || new Date(now.getTime() + 60 * 60 * 1000).toISOString() },
    conferenceData: {
      createRequest: {
        requestId: `alumnex-${roomId || Date.now()}-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });

  const meetLink = response.data.hangoutLink;
  if (!meetLink) {
    throw new Error('Google Calendar API did not return a hangoutLink');
  }

  // Cache the link so all participants get the same URL
  if (roomId) {
    meetLinksCache[roomId] = meetLink;
    console.log(`[GoogleMeet] Created real Meet link for room ${roomId}: ${meetLink}`);
  }

  return meetLink;
}

/**
 * Generate a consistent Jitsi Meet link as fallback when alumni hasn't connected Google.
 * All users joining with the same roomId will get the same Jitsi room.
 */
function generateJitsiFallback(roomId) {
  const code = `AlumNEX-${roomId}`.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://meet.jit.si/${code}`;
}

/**
 * Validate video call URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid video call URL
 */
function isValidMeetUrl(url) {
  return /^https:\/\/(meet\.jit\.si|meet\.google\.com)\/[a-zA-Z0-9-]+$/i.test(url);
}

module.exports = {
  createGoogleMeetLink,
  generateJitsiFallback,
  isValidMeetUrl,
  meetLinksCache,
  getOAuth2Client,
};
