const { google } = require('googleapis');

/**
 * Video Call Service — Google Meet & Jitsi
 * Falls back to Jitsi if Google OAuth is not connected.
 */

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.BACKEND_URL 
    ? `${process.env.BACKEND_URL}/auth/google/callback` 
    : 'http://localhost:5001/auth/google/callback'
);

/**
 * Creates a real Google Meet link using the user's refresh token
 * @param {string} refreshToken - The stored refresh token for the alumni
 * @param {string} title - Title of the meeting
 * @param {string} startTime - ISO string for meeting start
 * @param {string} endTime - ISO string for meeting end
 */
async function createGoogleMeetLink(refreshToken, title, startTime, endTime) {
  try {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary: title || 'AlumNEX Mentorship Interview',
      description: 'Interview session via AlumNEX Platform',
      start: { dateTime: startTime || new Date().toISOString() },
      end: { dateTime: endTime || new Date(Date.now() + 3600000).toISOString() }, // Default 1 hour
      conferenceData: {
        createRequest: {
          requestId: `alumnex-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    return response.data.hangoutLink;
  } catch (err) {
    console.error('[GoogleMeet] Failed to create Google Meet:', err.message);
    throw err;
  }
}

function generateSimpleMeetLink(roomId) {
  const code = `AlumNEX-${roomId}-${Math.random().toString(36).substring(2, 7)}`;
  return `https://meet.jit.si/${code}`;
}

function generateConsistentMeetLink(roomId) {
  const code = `AlumNEX-${roomId}`.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://meet.jit.si/${code}`;
}

function createMeetLinkWithCode(customCode) {
  return `https://meet.jit.si/${customCode.replace(/[^a-zA-Z0-9-]/g, '')}`;
}

function isValidMeetUrl(url) {
  return /^https:\/\/(meet\.jit\.si|meet\.google\.com)\/[a-zA-Z0-9-]+$/i.test(url);
}

module.exports = {
  createGoogleMeetLink,
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  isValidMeetUrl,
};
