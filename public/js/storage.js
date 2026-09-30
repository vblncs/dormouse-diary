// Persistence in the browser. The Storage object is injected so this module can be tested.

import { DIARY_STORAGE_KEY, LANGUAGE_STORAGE_KEY } from "./config.js";
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
