import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRANSLATIONS } from "../public/js/i18n/index.js";
import { LEVELS, bandFor, clampLevel, levelToPercent, percentToLevel } from "../public/js/scale.js";

describe("energy scale", () => {
  it("has ten levels", () => {
    assert.deepEqual(
      LEVELS.map((l) => l.value),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
  });
  it("clamps and rounds", () => {
    assert.equal(clampLevel(0), 1);
    assert.equal(clampLevel(11), 10);
    assert.equal(clampLevel(6.6), 7);
  });
  it("places level 10 at the top and 1 at the bottom", () => {
    assert.ok(levelToPercent(10) < levelToPercent(1));
  });
  it("maps a position back to the same level", () => {
    for (const { value } of LEVELS) assert.equal(percentToLevel(levelToPercent(value)), value);
  });
  it("maps positions outside the scale to the ends", () => {
    assert.equal(percentToLevel(0), 10);
    assert.equal(percentToLevel(100), 1);
  });
});

describe("descriptive bands", () => {
  const { bands } = TRANSLATIONS.en;
  it("finds the band of a level", () => {
    assert.equal(bandFor(1, bands)[2], "exhausted");
    assert.equal(bandFor(2, bands)[2], "exhausted");
    assert.equal(bandFor(6, bands)[2], "okay");
    assert.equal(bandFor(10, bands)[2], "full of energy");
  });
  it("rounds averages to the nearest level", () => {
    assert.equal(bandFor(6.4, bands)[2], "okay");
    assert.equal(bandFor(6.6, bands)[2], "good");
  });
});
