// When to remind the person to save a backup. Pure functions.
//
// The diary lives only in the browser, so a lost or reset phone means a lost diary.
// A gentle, dismissible reminder is the cheapest protection.

import { BACKUP_REMINDER_DAYS, BACKUP_SNOOZE_DAYS } from "./config.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between an ISO timestamp and now (null if there is no timestamp). */
export function daysSince(isoTimestamp, now) {
  if (!isoTimestamp) return null;
  const then = Date.parse(isoTimestamp);
  return Number.isNaN(then) ? null : Math.floor((now.getTime() - then) / DAY_MS);
}

/**
 * @param {object} state
 * @param {boolean} state.hasData       the diary has at least one entry
 * @param {string|null} state.lastBackup   ISO timestamp of the last backup
 * @param {string|null} state.snoozedUntil ISO timestamp until which "Later" hides the reminder
 * @param {Date} now
 */
export function shouldRemindBackup({ hasData, lastBackup, snoozedUntil }, now) {
  if (!hasData) return false;
  if (snoozedUntil && Date.parse(snoozedUntil) > now.getTime()) return false;
  const age = daysSince(lastBackup, now);
  return age == null || age >= BACKUP_REMINDER_DAYS;
}

/** ISO timestamp until which the reminder stays hidden after "Later". */
export function snoozeUntil(now) {
  return new Date(now.getTime() + BACKUP_SNOOZE_DAYS * DAY_MS).toISOString();
}
