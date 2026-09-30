// App-wide constants.

/** Shown in Settings → About. Must match "version" in package.json (checked by the tests). */
export const APP_VERSION = "1.4.0";

/** Start of exported file names, the same in every language: dormouse-diary-2026-09-30.csv */
export const FILE_PREFIX = "dormouse-diary";

/**
 * localStorage keys. They keep the app's first name ("Profilo energetico") on purpose:
 * renaming them would make existing diaries, languages and preferences disappear.
 */

/** localStorage key for the diary. Kept from the first version so existing diaries still load. */
export const DIARY_STORAGE_KEY = "profiloEnergetico.v1";

/** localStorage key for the chosen interface language. */
export const LANGUAGE_STORAGE_KEY = "profiloEnergetico.lang";

/** Version of the stored diary format (see README, "Data format"). */
export const SCHEMA_VERSION = 2;

/**
 * Default day: first slot 08:00–09:00, last slot 00:00–01:00.
 * `end` is the start hour of the last slot; values of 24 or more mean "after midnight, same diary day".
 */
export const DEFAULT_SETTINGS = Object.freeze({ start: 8, end: 24 });

/** Number of days offered on the trends tab. */
export const RANGE_OPTIONS = Object.freeze([7, 14, 30]);
export const DEFAULT_RANGE = 14;

/** Quick-pick buttons in the activity panel: at most this many… */
export const FREQUENT_MAX = 6;
/** …of the activities recorded at least this many times (a one-off is not "frequent"). */
export const FREQUENT_MIN_USES = 2;

/** Separator used when several activities are combined in one hour. */
export const ACTIVITY_SEPARATOR = " + ";
/**
 * What splits an entry into activities when counting them: "+" or a comma,
 * but not a decimal comma ("Walk 1,5 km" stays one activity).
 */
export const ACTIVITY_SPLIT = /\+|,(?!\d)/;

/** localStorage key for display preferences and backup bookkeeping (not part of the diary backup). */
export const PREFS_STORAGE_KEY = "profiloEnergetico.prefs";

/** Remind to make a backup when the last one is older than this (or there is none). */
export const BACKUP_REMINDER_DAYS = 14;
/** "Later" hides the reminder for this long. */
export const BACKUP_SNOOZE_DAYS = 7;

/** How often an open app checks whether the hour or the day has changed. */
export const CLOCK_CHECK_MS = 60 * 1000;
