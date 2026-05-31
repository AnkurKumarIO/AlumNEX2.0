const { startOfWeek } = require('date-fns');

/**
 * Returns the date of the most recent Monday at 00:00:00.
 * Can be localized based on environment or passed timezone if needed,
 * but defaulting to UTC/Server time for consistency.
 */
function getWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

function getNextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = { getWeekStart, getNextMonday };
