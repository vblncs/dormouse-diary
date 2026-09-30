// Persistence in the browser. The Storage object is injected so this module can be tested.

import { DIARY_STORAGE_KEY, LANGUAGE_STORAGE_KEY, PREFS_STORAGE_KEY } from "./config.js";
import { normalizeDiary } from "./diary.js";
import { isSupportedLanguage } from "./i18n/index.js";

/** localStorage, or null when the browser blocks it (private mode, disabled site data). */
export function browserStorage() {
  try {
    const storage = globalThis.localStorage;
    const probe = "__probe__";
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** The saved diary, or null if there is none (or it is unreadable). */
export function loadDiary(storage) {
  try {
    const raw = storage?.getItem(DIARY_STORAGE_KEY);
    return raw ? normalizeDiary(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** @returns {boolean} whether the diary was saved */
export function saveDiary(storage, diary) {
  try {
    storage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diary));
    return true;
  } catch {
    return false;
  }
}

export function clearDiary(storage) {
  try {
    storage?.removeItem(DIARY_STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

export function loadLanguage(storage) {
  try {
    const code = storage?.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(code) ? code : null;
  } catch {
    return null;
  }
}

export function saveLanguage(storage, code) {
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch {
    /* the choice just won't be remembered */
  }
}

/* ---------- preferences ---------- */

export const DEFAULT_PREFS = Object.freeze({
  /** "standard" (red → green) or "colorblind" (purple → yellow) */
  palette: "standard",
  /** "normal" or "large" */
  textSize: "normal",
  /** ISO timestamp of the last backup file saved */
  lastBackup: null,
  /** ISO timestamp until which the backup reminder is hidden */
  reminderSnoozedUntil: null,
});

const ALLOWED = { palette: ["standard", "colorblind"], textSize: ["normal", "large"] };

export function loadPrefs(storage) {
  let raw = {};
  try {
    raw = JSON.parse(storage?.getItem(PREFS_STORAGE_KEY) ?? "{}") ?? {};
  } catch {
    raw = {};
  }
  const prefs = { ...DEFAULT_PREFS };
  for (const key of Object.keys(ALLOWED)) if (ALLOWED[key].includes(raw[key])) prefs[key] = raw[key];
  for (const key of ["lastBackup", "reminderSnoozedUntil"]) if (typeof raw[key] === "string") prefs[key] = raw[key];
  return prefs;
}

export function savePrefs(storage, prefs) {
  try {
    storage?.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* preferences just won't be remembered */
  }
}

/**
 * What to tell the person about how safely the diary is kept. Pure.
 * @param {{ persisted: boolean|null, standalone: boolean }} state
 *   persisted: null when the browser cannot tell (no Storage API)
 * @returns {"unknown"|"granted"|"install"|"notGranted"}
 *   "install": not granted and not installed, so suggest adding the app to the home screen
 */
export function persistenceAdvice({ persisted, standalone }) {
  if (persisted == null) return "unknown";
  if (persisted) return "granted";
  return standalone ? "notGranted" : "install";
}

/** Whether the browser has agreed to keep this site's storage; null when it cannot tell. */
export async function storagePersisted() {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}

/** Whether the app runs installed (home screen / app window) rather than in a browser tab. */
export function isStandalone() {
  return Boolean(globalThis.matchMedia?.("(display-mode: standalone)").matches || globalThis.navigator?.standalone);
}

/**
 * Asks the browser not to delete the diary when space runs low (and, in Safari, after 7 days
 * without a visit). Best effort: some browsers decide on their own or ignore the request.
 */
export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
