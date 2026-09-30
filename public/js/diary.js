// The diary data model. Pure functions: no DOM, no storage. See README "Data format".
//
// Diary  = { v, settings: { start, end }, days: { [YYYY-MM-DD]: Day } }
// Day    = { note: string, hours: { [hour]: Entry } }
// Entry  = { e?: 1–10, n?: string }   (e = energy level, n = activity text)

import { ACTIVITY_SEPARATOR, DEFAULT_SETTINGS, SCHEMA_VERSION } from "./config.js";
import { addDays, toDateKey } from "./dates.js";
import { clampLevel } from "./scale.js";

/** Category ids used by the very first version, before activities became free text. */
const LEGACY_CATEGORIES = {
  sonno: "Sonno",
  riposo: "Riposo",
  pasto: "Pasto",
  igiene: "Igiene",
  casa: "Faccende di casa",
  lavoro: "Lavoro",
  movimento: "Movimento",
  terapia: "Terapia",
  spostamento: "Spostamenti",
  sociale: "Incontri",
  schermi: "Schermi",
  altro: "Altro",
};

export function createEmptyDiary() {
  return { v: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS }, days: {} };
}

function sanitizeSettings(raw) {
  let start = Number.isInteger(raw?.start) ? raw.start : DEFAULT_SETTINGS.start;
  let end = Number.isInteger(raw?.end) ? raw.end : DEFAULT_SETTINGS.end;
  // the first version defaulted to 06–23; move those diaries to the current default
  if (start === 6 && end === 23) ({ start, end } = DEFAULT_SETTINGS);
  start = Math.min(23, Math.max(0, start));
  end = Math.min(start + 23, Math.max(start, end));
  return { start, end };
}

function sanitizeEntry(raw) {
  if (!raw || typeof raw !== "object") return null;
  const entry = {};
  if (Number.isFinite(raw.e)) entry.e = clampLevel(raw.e);
  let text = typeof raw.n === "string" ? raw.n.trim() : "";
  if (Array.isArray(raw.a) && raw.a.length) {
    const legacy = raw.a.map((id) => LEGACY_CATEGORIES[id] ?? id).join(", ");
    text = text ? `${legacy} – ${text}` : legacy;
  }
  if (text) entry.n = text;
  return entry.e || entry.n ? entry : null;
}

/**
 * Validates and upgrades any stored or imported diary to the current format.
 * Returns a new object; throws if the input is not a diary at all.
 */
export function normalizeDiary(raw) {
  if (!raw || typeof raw !== "object" || !raw.days || typeof raw.days !== "object") {
    throw new TypeError("Not a diary");
  }
  const diary = createEmptyDiary();
  diary.settings = sanitizeSettings(raw.settings);
  for (const [key, rawDay] of Object.entries(raw.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !rawDay || typeof rawDay !== "object") continue;
    const day = { note: typeof rawDay.note === "string" ? rawDay.note : "", hours: {} };
    for (const [hour, rawEntry] of Object.entries(rawDay.hours ?? {})) {
      const entry = sanitizeEntry(rawEntry);
      if (entry && /^\d+$/.test(hour)) day.hours[hour] = entry;
    }
    if (day.note || Object.keys(day.hours).length) diary.days[key] = day;
  }
  return diary;
}

/** Start hours of every slot in the diary day, e.g. [8, 9, …, 24]. */
export function slotHours(settings) {
  const hours = [];
  for (let h = settings.start; h <= settings.end; h++) hours.push(h);
  return hours;
}

const EMPTY_DAY = Object.freeze({ note: "", hours: Object.freeze({}) });

/** Read-only view of a day (never undefined). */
export function getDay(diary, key) {
  return diary.days[key] ?? EMPTY_DAY;
}

export function getEntry(diary, key, hour) {
  return getDay(diary, key).hours[hour] ?? null;
}

function mutableDay(diary, key) {
  diary.days[key] ??= { note: "", hours: {} };
  return diary.days[key];
}

function cleanUp(diary, key, hour) {
  const day = diary.days[key];
  if (!day) return;
  const entry = day.hours[hour];
  if (entry && !entry.e && !entry.n) delete day.hours[hour];
  if (!day.note && !Object.keys(day.hours).length) delete diary.days[key];
}

/** Sets (level 1–10) or clears (null) the energy of one hour. Mutates the diary. */
export function setEnergy(diary, key, hour, level) {
  const day = mutableDay(diary, key);
  const entry = (day.hours[hour] ??= {});
  if (level == null) delete entry.e;
  else entry.e = clampLevel(level);
  cleanUp(diary, key, hour);
}

/** Sets or clears (empty text) the activity of one hour. Mutates the diary. */
export function setActivity(diary, key, hour, text) {
  const day = mutableDay(diary, key);
  const entry = (day.hours[hour] ??= {});
  const clean = String(text ?? "").trim();
  if (clean) entry.n = clean;
  else delete entry.n;
  cleanUp(diary, key, hour);
}

export function setNote(diary, key, note) {
  mutableDay(diary, key).note = String(note ?? "");
  cleanUp(diary, key, null);
}

/**
 * Sets the first slot and the slot after the last one, e.g. (8, 25) → 08:00–01:00.
 * Mutates the diary.
 */
export function setDayWindow(diary, start, endExclusive) {
  diary.settings = sanitizeSettings({ start, end: endExclusive - 1 });
}

/**
 * The diary day and slot that "now" belongs to. Slots after midnight belong to the previous
 * diary day: with a day of 08:00–01:00, 00:30 on 1 Oct is slot 24 of 30 Sep.
 * @param {{start:number,end:number}} settings
 * @param {Date} now
 * @returns {{ dateKey: string, hour: number | null }} hour is null outside the diary day
 */
export function currentSlot(settings, now) {
  const today = toDateKey(now);
  const hour = now.getHours();
  if (hour + 24 <= settings.end && hour < settings.start) return { dateKey: addDays(today, -1), hour: hour + 24 };
  return { dateKey: today, hour: hour >= settings.start && hour <= settings.end ? hour : null };
}

/** Appends an activity to existing text: "Breakfast" + "Reading" → "Breakfast + Reading". */
export function appendActivity(text, activity) {
  const current = String(text ?? "").trim();
  return current ? `${current}${ACTIVITY_SEPARATOR}${activity}` : activity;
}

/**
 * Activities the person typed themselves (not in any built-in list), for the suggestions while typing.
 * @param {Iterable<string>} builtIn
 */
export function customActivities(diary, builtIn, locale, limit = 30) {
  const known = new Set([...builtIn].map((a) => a.toLowerCase()));
  const found = new Map();
  for (const day of Object.values(diary.days)) {
    for (const entry of Object.values(day.hours)) {
      for (const part of (entry.n ?? "").split(ACTIVITY_SEPARATOR)) {
        const name = part.trim();
        if (name && !known.has(name.toLowerCase())) found.set(name.toLowerCase(), name);
      }
    }
  }
  return [...found.values()].sort((a, b) => a.localeCompare(b, locale)).slice(0, limit);
}

/**
 * A week of plausible sample data ending the day before `today`, in the given language.
 * Deterministic, so screenshots and tests are stable.
 */
export function createSampleDiary(t, today) {
  const diary = createEmptyDiary();
  let seed = 7;
  const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const restful = new Set([4, 6, 9, 14]); // indexes in demoPlan that are rest
  for (let back = 7; back >= 1; back--) {
    const key = addDays(today, -back);
    const base = 5 + Math.round(random() * 2) - (back % 3 === 0 ? 1 : 0);
    const hours = {};
    for (let h = 8; h <= 24; h++) {
      let e =
        base + (h >= 9 && h <= 11 ? 1 : 0) - (h >= 14 && h <= 15 ? 2 : 0) - (h >= 18 ? Math.round((h - 17) * 0.6) : 0);
      let n = t.demoPlan[h - 8];
      if (restful.has(h - 8)) e += 1;
      if (back === 3 && h === 16) n = t.demoTherapy;
      if (back === 3 && h >= 17) e -= 2;
      e = clampLevel(e + (random() - 0.5) * 1.4);
      if (h === 24 && random() < 0.4) continue;
      hours[h] = { e, n };
    }
    diary.days[key] = { note: back === 3 ? t.demoNote : "", hours };
  }
  return diary;
}
