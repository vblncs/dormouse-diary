// Loads the translation files and picks the language to use.
import de from "./de.js";
import en from "./en.js";
import fr from "./fr.js";
import it from "./it.js";

/** Translations by language code, in the order they appear in the language picker. */
export const TRANSLATIONS = Object.freeze({ it, fr, de, en });

/** Supported language codes. */
export const LANGUAGES = Object.freeze(Object.keys(TRANSLATIONS));

/** Language used when the device prefers one we do not support. */
export const FALLBACK_LANGUAGE = "en";

/** Native names shown in the language picker. */
export const LANGUAGE_NAMES = Object.freeze({
  it: "Italiano",
  fr: "Français",
  de: "Deutsch",
  en: "English",
});

export function isSupportedLanguage(code) {
  return typeof code === "string" && LANGUAGES.includes(code);
}

/**
 * Returns the first supported language from a list of BCP 47 tags
 * (e.g. navigator.languages), or the fallback language.
 * @param {readonly string[]} preferred
 */
export function detectLanguage(preferred = []) {
  for (const tag of preferred) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (isSupportedLanguage(code)) return code;
  }
  return FALLBACK_LANGUAGE;
}

/** @param {string} code */
export function getTranslation(code) {
  return TRANSLATIONS[isSupportedLanguage(code) ? code : FALLBACK_LANGUAGE];
}
