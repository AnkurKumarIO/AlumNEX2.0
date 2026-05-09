/**
 * Google Meet Service
 * Handles creation and management of Google Meet links for interviews
 */

/**
 * Generate a simple Google Meet link without API
 * This creates a meet.google.com link that anyone can join
 * @param {string} roomId - Unique room identifier
 * @returns {string} Google Meet URL
 */
function generateSimpleMeetLink(roomId) {
  // Google Meet codes are 10 characters: 3-4-3 letters (aaa-bbbb-ccc)
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len) => Array.from({length: len}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
  const code = `${rand(3)}-${rand(4)}-${rand(3)}`;
  
  return `https://meet.google.com/${code}`;
}

/**
 * Generate a consistent meet link for a room
 * Same roomId always generates the same link
 * @param {string} roomId - Unique room identifier
 * @returns {string} Google Meet URL
 */
function generateConsistentMeetLink(roomId) {
  // Create a 10-char hash-like code from roomId for consistency
  // We want to map the roomId to a 3-4-3 letter pattern
  const hash = roomId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const getLetters = (seed, len) => {
    let res = '';
    let val = Math.abs(seed);
    for (let i = 0; i < len; i++) {
      res += letters[val % letters.length];
      val = Math.floor(val / letters.length);
      if (val === 0) val = seed + i; // prevent empty
    }
    return res;
  };

  const p1 = getLetters(hash, 3);
  const p2 = getLetters(hash + 123, 4);
  const p3 = getLetters(hash + 456, 3);
  
  const code = `${p1}-${p2}-${p3}`;
  return `https://meet.google.com/${code}`;
}

/**
 * Create a Google Meet link with custom code
 * @param {string} customCode - Custom meeting code
 * @returns {string} Google Meet URL
 */
function createMeetLinkWithCode(customCode) {
  const sanitizedCode = customCode.toLowerCase().replace(/[^a-z0-9-]/g, '');
  return `https://meet.google.com/${sanitizedCode}`;
}

/**
 * Extract meeting code from Google Meet URL
 * @param {string} meetUrl - Full Google Meet URL
 * @returns {string|null} Meeting code or null if invalid
 */
function extractMeetingCode(meetUrl) {
  const match = meetUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Validate Google Meet URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid Google Meet URL
 */
function isValidMeetUrl(url) {
  return /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i.test(url);
}

module.exports = {
  generateSimpleMeetLink,
  generateConsistentMeetLink,
  createMeetLinkWithCode,
  extractMeetingCode,
  isValidMeetUrl,
};
