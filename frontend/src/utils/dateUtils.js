/**
 * Ensures a DB timestamp is always parsed as UTC.
 *
 * Supabase returns timestamps without timezone info (e.g. "2026-05-26T00:33:07").
 * Passing such a string to `new Date()` causes the browser to interpret it as
 * local time (IST = UTC+5:30), shifting every displayed time by 5.5 hours.
 * Appending 'Z' forces UTC parsing. If the string already carries timezone info
 * (ends with Z, or has a +HH:MM / -HH:MM offset) it is passed through unchanged.
 *
 * @param {string|number|Date|null|undefined} ts - The timestamp to normalise.
 * @returns {Date} A Date object parsed in UTC. Returns `new Date(NaN)` for falsy input.
 */
export function toUtcDate(ts) {
  if (!ts) return new Date(NaN);
  const s = String(ts);
  if (/[Zz]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(s + 'Z');
}
