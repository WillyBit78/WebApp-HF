/**
 * Utility to parse any date string format robustly:
 * - "2026-07-31" (ISO YYYY-MM-DD)
 * - "2026-07-31T02:08:00.000Z" (Full ISO)
 * - "31/07/2026" or "31/7/2026" (Latin DD/MM/YYYY)
 * - "31/07/2026, 02:08" (Latin DD/MM/YYYY with time)
 * - Timestamps (number)
 */
export const parseAnyDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (typeof dateVal === 'number') return new Date(dateVal);

  const str = String(dateVal).trim();
  if (!str) return null;

  // Check DD/MM/YYYY format
  if (str.includes('/')) {
    const parts = str.split(/[\s,]+/)[0].split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-based month in JS
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }

  // Fallback to standard Date constructor for ISO / YYYY-MM-DD
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
};

/**
 * Formats a Date object to YYYY-MM-DD for standard date input comparisons
 */
export const toIsoDateString = (dateVal) => {
  const d = parseAnyDate(dateVal);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Checks if a date falls in current month and year
 */
export const isSameMonthAndYear = (dateVal, targetDate = new Date()) => {
  const d = parseAnyDate(dateVal);
  if (!d) return true; // If date missing, include by default so data is not lost
  const target = parseAnyDate(targetDate) || new Date();
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
};

/**
 * Checks if a date falls in range dateFrom <= d <= dateTo (YYYY-MM-DD strings)
 */
export const isDateInRange = (dateVal, dateFrom, dateTo) => {
  const d = parseAnyDate(dateVal);
  if (!d) return true; // If date missing, include by default
  const isoDate = toIsoDateString(d);

  if (dateFrom && isoDate < dateFrom) return false;
  if (dateTo && isoDate > dateTo) return false;
  return true;
};

/**
 * Returns period string in YYYY-MM format (e.g. "2026-08")
 */
export const getPeriodString = (dateVal = new Date()) => {
  const d = parseAnyDate(dateVal) || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

/**
 * Checks if the given date is the last day of its month
 */
export const isLastDayOfMonth = (dateVal = new Date()) => {
  const d = parseAnyDate(dateVal) || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return d.getDate() === lastDay;
};

/**
 * Returns period string of the next month (e.g. "2026-09")
 */
export const getNextPeriodString = (dateVal = new Date()) => {
  const d = parseAnyDate(dateVal) || new Date();
  const nextMonthDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return getPeriodString(nextMonthDate);
};

