// Date keys (YYYY-MM-DD, local time), hour labels and locale formatting.

export const pad2 = (n) => String(n).padStart(2, "0");

/** @param {Date} date */
export function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** @param {string} key YYYY-MM-DD */
export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** @param {string} key @param {number} days */
export function addDays(key, days) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function todayKey(now = new Date()) {
  return toDateKey(now);
}

/** Keys of `count` consecutive days ending with `endKey`, oldest first. */
export function dayRange(endKey, count) {
  return Array.from({ length: count }, (_, i) => addDays(endKey, i - count + 1));
}

/** 8 → "08:00", 24 → "00:00" */
export const hourLabel = (hour) => `${pad2(hour % 24)}:00`;

/** 8 → "08–09", 24 → "00–01" */
export const slotLabel = (hour) => `${pad2(hour % 24)}–${pad2((hour + 1) % 24)}`;

export function formatLongDate(key, lang) {
  return new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(fromDateKey(key));
}

/** "Wednesday 30 September 2026", in the given language (for printed forms). */
export function formatFullDate(key, lang) {
  return new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    fromDateKey(key),
  );
}

export function formatShortDate(key, lang) {
  return new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "numeric" }).format(fromDateKey(key));
}

/** One decimal, locale separator; "–" for null. */
export function formatDecimal(value, lang) {
  if (value == null) return "–";
  return new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
