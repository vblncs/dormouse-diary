import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activityStats, daySummary, filledDays, hourlyAverages, mean, trendOf } from "../public/js/analysis.js";
import { diaryToCsv } from "../public/js/csv.js";
import { createEmptyDiary, setActivity, setEnergy, setNote } from "../public/js/diary.js";
import { TRANSLATIONS } from "../public/js/i18n/index.js";

const D1 = "2026-09-29";
const D2 = "2026-09-30";

function sampleDiary() {
  const diary = createEmptyDiary();
  // day 1: walk drains energy, rest restores it
  setEnergy(diary, D1, 8, 6);
  setActivity(diary, D1, 8, "Walk");
  setEnergy(diary, D1, 9, 4);
  setActivity(diary, D1, 9, "Rest");
  setEnergy(diary, D1, 10, 6);
  // day 2
  setEnergy(diary, D2, 8, 8);
  setActivity(diary, D2, 8, "walk");
  setEnergy(diary, D2, 9, 6);
  setActivity(diary, D2, 24, "Sleeping");
  setNote(diary, D2, 'Said "tired"');
  return diary;
}

describe("summaries", () => {
  it("mean of an empty list is null", () => {
    assert.equal(mean([]), null);
    assert.equal(mean([2, 4]), 3);
  });

  it("summarises one day", () => {
    assert.deepEqual(daySummary(sampleDiary(), D1, [8, 9, 10, 11]), {
      average: 16 / 3,
      lowest: 4,
      highest: 6,
      filled: 3,
    });
  });

  it("returns nulls for an empty day", () => {
    assert.deepEqual(daySummary(createEmptyDiary(), D1, [8, 9]), {
      average: null,
      lowest: null,
      highest: null,
      filled: 0,
    });
  });

  it("averages each hour across days", () => {
    assert.deepEqual(hourlyAverages(sampleDiary(), [D1, D2], [8, 9, 10, 11]), [7, 5, 6, null]);
  });

  it("lists days with at least one energy level", () => {
    assert.deepEqual(filledDays(sampleDiary(), ["2026-09-28", D1, D2]), [D1, D2]);
  });
});

describe("activityStats", () => {
  it("groups case-insensitively and measures the next hour", () => {
    const [walk, ...rest] = activityStats(sampleDiary(), [D1, D2]);
    assert.equal(walk.label, "Walk");
    assert.equal(walk.count, 2);
    assert.equal(walk.average, 7);
    assert.equal(walk.delta, -2);
    assert.equal(walk.trend, "down");
    const restRow = rest.find((r) => r.label === "Rest");
    assert.equal(restRow.trend, "up");
    const sleeping = rest.find((r) => r.label === "Sleeping");
    assert.equal(sleeping.average, null);
    assert.equal(sleeping.trend, null);
  });

  it("classifies small changes as stable", () => {
    assert.equal(trendOf(0.2), "stable");
    assert.equal(trendOf(-0.3), "down");
    assert.equal(trendOf(null), null);
  });
});

describe("diaryToCsv", () => {
  it("writes a BOM, a header, one row per hour and one per note", () => {
    const csv = diaryToCsv(sampleDiary(), TRANSLATIONS.en);
    assert.ok(csv.startsWith("\ufeff"));
    const lines = csv.slice(1).split("\r\n");
    assert.equal(lines[0], "date;time;energy (1-10);activity");
    assert.equal(lines[1], '2026-09-29;08:00-09:00;6;"Walk"');
    assert.ok(lines.includes('2026-09-30;00:00-01:00;;"Sleeping"'), "hour 24 is written as 00:00");
    assert.equal(lines.at(-1), '2026-09-30;note;;"Said ""tired"""');
    assert.equal(lines.length, 1 + 6 + 1);
  });
});
