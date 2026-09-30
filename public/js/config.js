// App-wide constants.

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

/** Separator used when several activities are combined in one hour. */
export const ACTIVITY_SEPARATOR = " + ";

/** localStorage key for display preferences and backup bookkeeping (not part of the diary backup). */
export const PREFS_STORAGE_KEY = "profiloEnergetico.prefs";

/** Remind to make a backup when the last one is older than this (or there is none). */
export const BACKUP_REMINDER_DAYS = 14;
/** "Later" hides the reminder for this long. */
export const BACKUP_SNOOZE_DAYS = 7;
