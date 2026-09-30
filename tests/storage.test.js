import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIARY_STORAGE_KEY, LANGUAGE_STORAGE_KEY, PREFS_STORAGE_KEY } from "../public/js/config.js";
import { createEmptyDiary, setEnergy } from "../public/js/diary.js";
import {
  DEFAULT_PREFS,
  clearDiary,
  loadDiary,
  loadLanguage,
  loadPrefs,
  persistenceAdvice,
  saveDiary,
  saveLanguage,
  savePrefs,
} from "../public/js/storage.js";

/** In-memory stand-in for window.localStorage. */
function memoryStorage({ failWrites = false } = {}) {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => {
      if (failWrites) throw new Error("QuotaExceededError");
      data.set(k, String(v));
    },
    removeItem: (k) => data.delete(k),
  };
}

describe("storage", () => {
  it("saves and loads a diary", () => {
    const storage = memoryStorage();
    const diary = createEmptyDiary();
    setEnergy(diary, "2026-09-30", 8, 5);
    assert.equal(saveDiary(storage, diary), true);
    assert.deepEqual(loadDiary(storage), diary);
  });

  it("returns null when nothing is stored or the data is corrupt", () => {
    const storage = memoryStorage();
    assert.equal(loadDiary(storage), null);
    storage.setItem(DIARY_STORAGE_KEY, "{not json");
    assert.equal(loadDiary(storage), null);
    assert.equal(loadDiary(null), null);
  });

  it("reports failed writes instead of throwing", () => {
    assert.equal(saveDiary(memoryStorage({ failWrites: true }), createEmptyDiary()), false);
  });

  it("clears the diary", () => {
    const storage = memoryStorage();
    saveDiary(storage, createEmptyDiary());
    clearDiary(storage);
    assert.equal(loadDiary(storage), null);
  });

  it("remembers only supported languages", () => {
    const storage = memoryStorage();
    saveLanguage(storage, "fr");
    assert.equal(loadLanguage(storage), "fr");
    saveLanguage(storage, "xx");
    assert.equal(loadLanguage(storage), null);
  });
});

describe("storage keys", () => {
  // Renaming these would make every existing diary, language choice and preference disappear.
  it("are still the ones from the first version", () => {
    assert.equal(DIARY_STORAGE_KEY, "profiloEnergetico.v1");
    assert.equal(LANGUAGE_STORAGE_KEY, "profiloEnergetico.lang");
    assert.equal(PREFS_STORAGE_KEY, "profiloEnergetico.prefs");
  });

  it("load a diary, language and preferences saved by version 1.2.0", () => {
    const storage = memoryStorage();
    // exactly as 1.2.0 wrote them
    storage.setItem(
      "profiloEnergetico.v1",
      '{"v":2,"settings":{"start":8,"end":24},"days":{"2026-09-29":{"note":"Slept badly","hours":{"8":{"e":6,"n":"Breakfast + Cat"},"24":{"e":2}}}}}',
    );
    storage.setItem("profiloEnergetico.lang", "de");
    storage.setItem(
      "profiloEnergetico.prefs",
      '{"palette":"colorblind","textSize":"large","lastBackup":"2026-09-20T08:00:00.000Z","reminderSnoozedUntil":null}',
    );
    assert.deepEqual(loadDiary(storage), {
      v: 2,
      settings: { start: 8, end: 24 },
      days: { "2026-09-29": { note: "Slept badly", hours: { 8: { e: 6, n: "Breakfast + Cat" }, 24: { e: 2 } } } },
    });
    assert.equal(loadLanguage(storage), "de");
    assert.deepEqual(loadPrefs(storage), {
      ...DEFAULT_PREFS,
      palette: "colorblind",
      textSize: "large",
      lastBackup: "2026-09-20T08:00:00.000Z",
    });
  });
});

describe("persistenceAdvice", () => {
  it("says nothing when the browser cannot tell", () => {
    assert.equal(persistenceAdvice({ persisted: null, standalone: false }), "unknown");
  });
  it("reports persistent storage", () => {
    assert.equal(persistenceAdvice({ persisted: true, standalone: false }), "granted");
  });
  it("suggests installing only when not granted and not installed", () => {
    assert.equal(persistenceAdvice({ persisted: false, standalone: false }), "install");
    assert.equal(persistenceAdvice({ persisted: false, standalone: true }), "notGranted");
  });
});

describe("preferences", () => {
  it("defaults when nothing is stored", () => {
    assert.deepEqual(loadPrefs(memoryStorage()), DEFAULT_PREFS);
  });
  it("round-trips valid values", () => {
    const storage = memoryStorage();
    const prefs = {
      ...DEFAULT_PREFS,
      palette: "colorblind",
      textSize: "large",
      lastBackup: "2026-09-30T10:00:00.000Z",
    };
    savePrefs(storage, prefs);
    assert.deepEqual(loadPrefs(storage), prefs);
  });
  it("ignores unknown or corrupt values", () => {
    const storage = memoryStorage();
    storage.setItem("profiloEnergetico.prefs", JSON.stringify({ palette: "neon", textSize: 3, lastBackup: 5 }));
    assert.deepEqual(loadPrefs(storage), DEFAULT_PREFS);
    storage.setItem("profiloEnergetico.prefs", "{broken");
    assert.deepEqual(loadPrefs(storage), DEFAULT_PREFS);
  });
});
