const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// The path to the downloaded JSON key
const KEY_PATH = path.join(__dirname, '../../alumnex-495906-c89292eb6921.json');

// Store the meet links so they are consistent for the same room
const meetLinksCache = {};

/**
 * Initializes the Google Calendar API client using the service account.
 */
function getCalendarClient() {
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`Google Service Account JSON key not found at ${KEY_PATH}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });

  return google.calendar({ version: 'v3', auth });
}

/**
 * Generates a real Google Meet link by creating an event on the service account's calendar.
 * @param {string} roomId - Unique room identifier
 * @param {string} title - Optional title for the event
 * @returns {Promise<string>} The Google Meet URL
 */
async function generateMeetLink(roomId, title = 'AlumNEX Mock Interview') {
  // If we already generated a link for this room, return it so both users get the same link
  if (meetLinksCache[roomId]) {
    return meetLinksCache[roomId];
  }

  try {
    const calendar = getCalendarClient();
    
    // Create an event starting now and ending in 2 hours
    const now = new Date();
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const event = {
      summary: title,
      description: `Automated mock interview session for AlumNEX room: ${roomId}`,
      start: { dateTime: now.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `alumnex-${roomId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const response = await calendar.events.insert({
      calendarId: calendarId, // Use the configured calendar or fallback to primary
      resource: event,
      conferenceDataVersion: 1, // Required to generate the meet link
    });

    // Extract the Meet link
    const meetLink = response.data.hangoutLink;
    if (!meetLink) {
      throw new Error('Google API did not return a hangoutLink');
    }

    // Cache the link for this room
    meetLinksCache[roomId] = meetLink;
    return meetLink;

  } catch (error) {
    console.error('Error creating Google Meet link:', error.message);
    throw error;
  }
}

/**
 * Validate video call URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid video call URL
 */
function isValidMeetUrl(url) {
  return /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url) ||
         /^https:\/\/meet\.jit\.si\/[a-zA-Z0-9-]+$/i.test(url);
}

module.exports = {
  generateMeetLink,
  isValidMeetUrl,
  meetLinksCache
};
