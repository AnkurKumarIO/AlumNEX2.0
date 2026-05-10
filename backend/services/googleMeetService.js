/**
 * Video Call Service — Jitsi Meet
 * Generates instant, working video room links using Jitsi Meet (free, no API keys)
 * Both parties get the same deterministic URL based on roomId
 */

/**
 * Generate a simple video call link
 * @param {string} roomId - Unique room identifier
 * @returns {string} Jitsi Meet URL
 */
function generateSimpleMeetLink(roomId) {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  const code = `AlumNEX-${roomId}-${timestamp}${randomPart}`;
  return `https://meet.jit.si/${code}`;
}

/**
 * Generate a consistent meet link for a room
 * Same roomId always generates the same link — both parties get identical URL
 * @param {string} roomId - Unique room identifier
 * @returns {string} Jitsi Meet URL
 */
function generateConsistentMeetLink(roomId) {
  const code = `AlumNEX-${roomId}`.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://meet.jit.si/${code}`;
}

/**
 * Create a video call link with custom code
 * @param {string} customCode - Custom meeting code
 * @returns {string} Jitsi Meet URL
 */
function createMeetLinkWithCode(customCode) {
  const sanitizedCode = customCode.replace(/[^a-zA-Z0-9-]/g, '');
  return `https://meet.jit.si/${sanitizedCode}`;
}

/**
 * Extract meeting code from video call URL
 * @param {string} meetUrl - Full Jitsi Meet URL
 * @returns {string|null} Meeting code or null if invalid
 */
function extractMeetingCode(meetUrl) {
  const jitsiMatch = meetUrl.match(/meet\.jit\.si\/([a-zA-Z0-9-]+)/i);
  if (jitsiMatch) return jitsiMatch[1];
  const googleMatch = meetUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  if (googleMatch) return googleMatch[1];
  return null;
}

/**
 * Validate video call URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid video call URL
 */
function isValidMeetUrl(url) {
  return /^https:\/\/meet\.jit\.si\/[a-zA-Z0-9-]+$/i.test(url) ||
         /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url);
}

module.exports = {
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  extractMeetingCode,
  isValidMeetUrl,
};
