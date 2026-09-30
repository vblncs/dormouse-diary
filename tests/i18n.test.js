import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FALLBACK_LANGUAGE, LANGUAGES, TRANSLATIONS, detectLanguage, getTranslation } from "../public/js/i18n/index.js";

describe("translations", () => {
  const reference = TRANSLATIONS.en;

  for (const code of LANGUAGES) {
    const t = TRANSLATIONS[code];

    it(`${code} has exactly the same keys as en`, () => {
      assert.deepEqual(Object.keys(t).sort(), Object.keys(reference).sort());
    });

    it(`${code} uses the same value types as en`, () => {
      for (const [key, value] of Object.entries(reference)) {
        assert.equal(typeof t[key], typeof value, `type of "${key}"`);
        assert.equal(Array.isArray(t[key]), Array.isArray(value), `array-ness of "${key}"`);
      }
    });

    it(`${code} has no empty strings`, () => {
      for (const [key, value] of Object.entries(t)) {
        if (typeof value === "string") assert.ok(value.trim(), `"${key}" is empty`);
      }
    });

    it(`${code} bands cover 1–10 without gaps or overlaps`, () => {
      const covered = t.bands.flatMap(([from, to]) => Array.from({ length: to - from + 1 }, (_, i) => from + i));
      assert.deepEqual(covered, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (const [, , label] of t.bands) assert.ok(label);
    });

    it(`${code} sample plan has one activity per slot 08:00–01:00`, () => {
      assert.equal(t.demoPlan.length, 17);
    });

    it(`${code} CSV header has four columns`, () => {
      assert.equal(t.csvHead.length, 4);
    });
  }
});

describe("detectLanguage", () => {
  it("picks the first supported language", () => {
    assert.equal(detectLanguage(["es-ES", "de-CH", "fr"]), "de");
  });
  it("ignores region and case", () => {
    assert.equal(detectLanguage(["FR-ch"]), "fr");
  });
  it("falls back to English", () => {
    assert.equal(detectLanguage(["es", "pt-BR"]), FALLBACK_LANGUAGE);
    assert.equal(detectLanguage([]), FALLBACK_LANGUAGE);
  });
  it("getTranslation falls back for unknown codes", () => {
    assert.equal(getTranslation("xx"), TRANSLATIONS[FALLBACK_LANGUAGE]);
  });
});
