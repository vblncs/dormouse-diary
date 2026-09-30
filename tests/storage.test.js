import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DIARY_STORAGE_KEY } from "../public/js/config.js";
import { createEmptyDiary, setEnergy } from "../public/js/diary.js";
import { clearDiary, loadDiary, loadLanguage, saveDiary, saveLanguage } from "../public/js/storage.js";

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
