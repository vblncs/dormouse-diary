// Summaries computed from the diary. Pure functions, used by the views and the tests.

import { ACTIVITY_SPLIT, FREQUENT_MAX, FREQUENT_MIN_USES } from "./config.js";
import { getDay } from "./diary.js";

/** Arithmetic mean, or null for an empty list. */
export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Average energy per slot across several days (null where nothing was recorded). */
export function hourlyAverages(diary, keys, hours) {
  return hours.map((h) => mean(keys.map((k) => getDay(diary, k).hours[h]?.e).filter(Boolean)));
}

/** Days in `keys` that have at least one energy level. */
export function filledDays(diary, keys) {
  return keys.filter((k) => Object.values(getDay(diary, k).hours).some((entry) => entry.e));
}

/** Change smaller than this (in levels) counts as "stable". */
export const STABLE_THRESHOLD = 0.25;

/** @returns {"down"|"up"|"stable"|null} */
export function trendOf(delta) {
  if (delta == null) return null;
  if (delta < -STABLE_THRESHOLD) return "down";
  if (delta > STABLE_THRESHOLD) return "up";
  return "stable";
}

/**
 * For each activity text (case-insensitive): how often it was recorded, the average energy
 * during it and the average change in energy in the following hour. Most frequent first.
 */
export function activityStats(diary, keys, limit = 15) {
  const stats = new Map();
  for (const key of keys) {
    const day = getDay(diary, key);
    for (const [hour, entry] of Object.entries(day.hours)) {
      if (!entry.n) continue;
      const id = entry.n.trim().toLowerCase();
      if (!stats.has(id)) stats.set(id, { label: entry.n.trim(), count: 0, levels: [], deltas: [] });
      const s = stats.get(id);
      s.count++;
      if (entry.e) s.levels.push(entry.e);
      const next = day.hours[Number(hour) + 1];
      if (entry.e && next?.e) s.deltas.push(next.e - entry.e);
    }
  }
  return [...stats.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ label, count, levels, deltas }) => {
      const delta = mean(deltas);
      return { label, count, average: mean(levels), delta, trend: trendOf(delta) };
    });
}

/**
 * The activities recorded most often (each part of "A + B" or "A, B" counts separately), most frequent first.
 * Used for the quick-pick buttons in the activity panel.
 */
export function frequentActivities(diary, limit = FREQUENT_MAX, minUses = FREQUENT_MIN_USES) {
  const counts = new Map();
  for (const day of Object.values(diary.days)) {
    for (const entry of Object.values(day.hours)) {
      for (const part of (entry.n ?? "").split(ACTIVITY_SPLIT)) {
        const name = part.trim();
        if (!name) continue;
        const id = name.toLowerCase();
        const item = counts.get(id) ?? { name, count: 0 };
        item.count++;
        counts.set(id, item);
      }
    }
  }
  return [...counts.values()]
    .filter((item) => item.count >= minUses)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((item) => item.name);
}
