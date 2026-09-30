import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SETTINGS, SCHEMA_VERSION } from "../public/js/config.js";
import {
  appendActivity,
  createEmptyDiary,
  createSampleDiary,
  currentSlot,
  getEntry,
  mergeDiaries,
  normalizeDiary,
  setActivity,
  setDayWindow,
  setEnergy,
  setNote,
  slotHours,
} from "../public/js/diary.js";
import { TRANSLATIONS } from "../public/js/i18n/index.js";

const DAY = "2026-09-30";

describe("normalizeDiary", () => {
  it("rejects things that are not a diary", () => {
    assert.throws(() => normalizeDiary(null));
    assert.throws(() => normalizeDiary({ foo: 1 }));
    assert.throws(() => normalizeDiary("text"));
  });

  it("keeps valid entries and drops invalid ones", () => {
    const diary = normalizeDiary({
      days: {
        [DAY]: { note: "ok", hours: { 8: { e: 6, n: " Reading " }, 9: { e: "x" }, x: { e: 5 }, 10: {} } },
        "not-a-date": { hours: { 8: { e: 5 } } },
      },
    });
    assert.deepEqual(diary.days, { [DAY]: { note: "ok", hours: { 8: { e: 6, n: "Reading" } } } });
    assert.equal(diary.v, SCHEMA_VERSION);
  });

  it("clamps energy levels to 1–10", () => {
    const diary = normalizeDiary({ days: { [DAY]: { hours: { 8: { e: 14 }, 9: { e: -2 } } } } });
    assert.equal(diary.days[DAY].hours[8].e, 10);
    assert.equal(diary.days[DAY].hours[9].e, 1);
  });

  it("converts first-version activity categories to text", () => {
    const diary = normalizeDiary({ days: { [DAY]: { hours: { 8: { e: 5, a: ["pasto", "sociale"], n: "pizza" } } } } });
    assert.equal(diary.days[DAY].hours[8].n, "Pasto, Incontri – pizza");
  });

  it("moves the old 06–23 default to the current default", () => {
    assert.deepEqual(normalizeDiary({ settings: { start: 6, end: 23 }, days: {} }).settings, DEFAULT_SETTINGS);
  });

  it("drops the legend flags stored by earlier versions", () => {
    const diary = normalizeDiary({ settings: { start: 8, end: 24, showNums: true }, days: {} });
    assert.deepEqual(diary.settings, { start: 8, end: 24 });
  });

  it("does not modify its input", () => {
    const input = { days: { [DAY]: { hours: { 8: { e: 5, a: ["pasto"] } } } } };
    const copy = structuredClone(input);
    normalizeDiary(input);
    assert.deepEqual(input, copy);
  });
});

describe("editing", () => {
  it("sets and clears energy and activity, removing empty days", () => {
    const diary = createEmptyDiary();
    setEnergy(diary, DAY, 9, 7);
    setActivity(diary, DAY, 9, "Walk");
    assert.deepEqual(getEntry(diary, DAY, 9), { e: 7, n: "Walk" });
    setEnergy(diary, DAY, 9, null);
    assert.deepEqual(getEntry(diary, DAY, 9), { n: "Walk" });
    setActivity(diary, DAY, 9, "  ");
    assert.equal(getEntry(diary, DAY, 9), null);
    assert.deepEqual(diary.days, {});
  });

  it("keeps a day that only has a note", () => {
    const diary = createEmptyDiary();
    setNote(diary, DAY, "Slept badly");
    assert.equal(diary.days[DAY].note, "Slept badly");
    setNote(diary, DAY, "");
    assert.deepEqual(diary.days, {});
  });

  it("sets the day window, allowing hours past midnight", () => {
    const diary = createEmptyDiary();
    setDayWindow(diary, 7, 26); // 07:00 → 02:00
    assert.deepEqual(diary.settings, { start: 7, end: 25 });
    assert.equal(slotHours(diary.settings).length, 19);
  });

  it("never allows more than 24 slots", () => {
    const diary = createEmptyDiary();
    setDayWindow(diary, 8, 99);
    assert.equal(slotHours(diary.settings).length, 24);
  });

  it("appends activities with a separator", () => {
    assert.equal(appendActivity("", "Lunch"), "Lunch");
    assert.equal(appendActivity("Lunch ", "Reading"), "Lunch + Reading");
  });
});

describe("mergeDiaries", () => {
  const diaryWith = (days) => normalizeDiary({ settings: { start: 8, end: 24 }, days });

  it("adds days that are only in the backup", () => {
    const current = diaryWith({ "2026-09-29": { hours: { 8: { e: 5 } } } });
    const backup = diaryWith({ "2026-09-28": { note: "Tired", hours: { 9: { e: 3, n: "Nap" } } } });
    const { diary, stats } = mergeDiaries(current, backup);
    assert.deepEqual(diary.days["2026-09-28"], { note: "Tired", hours: { 9: { e: 3, n: "Nap" } } });
    assert.deepEqual(diary.days["2026-09-29"], current.days["2026-09-29"]);
    assert.deepEqual(stats, { daysAdded: 1, daysCompleted: 0, hoursKept: 0 });
  });

  it("completes partial days with the missing hours", () => {
    const current = diaryWith({ [DAY]: { hours: { 8: { e: 5 } } } });
    const backup = diaryWith({ [DAY]: { hours: { 8: { e: 5 }, 9: { e: 6, n: "Walk" } } } });
    const { diary, stats } = mergeDiaries(current, backup);
    assert.deepEqual(diary.days[DAY].hours, { 8: { e: 5 }, 9: { e: 6, n: "Walk" } });
    assert.deepEqual(stats, { daysAdded: 0, daysCompleted: 1, hoursKept: 0 });
  });

  it("keeps the current value when an hour is filled in both", () => {
    const current = diaryWith({ [DAY]: { hours: { 8: { e: 5, n: "Work" } } } });
    const backup = diaryWith({ [DAY]: { hours: { 8: { e: 2, n: "Sleeping" } } } });
    const { diary, stats } = mergeDiaries(current, backup);
    assert.deepEqual(diary.days[DAY].hours[8], { e: 5, n: "Work" });
    assert.deepEqual(stats, { daysAdded: 0, daysCompleted: 0, hoursKept: 1 });
  });

  it("takes the backup's note when the current day has none, and ignores identical notes", () => {
    const current = diaryWith({ [DAY]: { hours: { 8: { e: 5 } } }, "2026-09-29": { note: "Slept badly" } });
    const backup = diaryWith({ [DAY]: { note: "Headache" }, "2026-09-29": { note: "Slept badly" } });
    const { diary, stats } = mergeDiaries(current, backup);
    assert.equal(diary.days[DAY].note, "Headache");
    assert.equal(diary.days["2026-09-29"].note, "Slept badly");
    assert.deepEqual(stats, { daysAdded: 0, daysCompleted: 1, hoursKept: 0 });
  });

  it("appends a different note on a new line, only once", () => {
    const current = diaryWith({ [DAY]: { note: "Slept badly" } });
    const backup = diaryWith({ [DAY]: { note: "Physio in the afternoon" } });
    const once = mergeDiaries(current, backup);
    assert.equal(once.diary.days[DAY].note, "Slept badly\nPhysio in the afternoon");
    const twice = mergeDiaries(once.diary, backup);
    assert.equal(twice.diary.days[DAY].note, "Slept badly\nPhysio in the afternoon");
    assert.deepEqual(twice.stats, { daysAdded: 0, daysCompleted: 0, hoursKept: 0 });
  });

  it("keeps the current day hours and leaves both inputs unchanged", () => {
    const current = normalizeDiary({ settings: { start: 7, end: 22 }, days: { [DAY]: { hours: { 8: { e: 5 } } } } });
    const backup = normalizeDiary({ settings: { start: 9, end: 25 }, days: { [DAY]: { hours: { 9: { e: 4 } } } } });
    const before = structuredClone([current, backup]);
    const { diary } = mergeDiaries(current, backup);
    assert.deepEqual(diary.settings, { start: 7, end: 22 });
    assert.deepEqual([current, backup], before);
  });
});

describe("createSampleDiary", () => {
  const t = TRANSLATIONS.it;

  it("creates the seven days before today", () => {
    const diary = createSampleDiary(t, DAY);
    assert.deepEqual(Object.keys(diary.days).sort(), [
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
    ]);
  });

  it("is deterministic and valid", () => {
    const a = createSampleDiary(t, DAY);
    assert.deepEqual(a, createSampleDiary(t, DAY));
    assert.deepEqual(normalizeDiary(a), a);
  });
});

describe("currentSlot", () => {
  const settings = { start: 8, end: 24 }; // 08:00–01:00
  const at = (iso) => new Date(iso); // local time

  it("returns today's slot during the day", () => {
    assert.deepEqual(currentSlot(settings, at("2026-09-30T15:20:00")), { dateKey: "2026-09-30", hour: 15 });
  });
  it("puts the hour after midnight on the previous diary day", () => {
    assert.deepEqual(currentSlot(settings, at("2026-10-01T00:30:00")), { dateKey: "2026-09-30", hour: 24 });
  });
  it("returns no slot outside the diary hours", () => {
    assert.deepEqual(currentSlot(settings, at("2026-10-01T03:00:00")), { dateKey: "2026-10-01", hour: null });
    assert.deepEqual(currentSlot(settings, at("2026-10-01T07:59:00")), { dateKey: "2026-10-01", hour: null });
  });
  it("works for a day that ends before midnight", () => {
    assert.deepEqual(currentSlot({ start: 6, end: 22 }, at("2026-10-01T00:30:00")), {
      dateKey: "2026-10-01",
      hour: null,
    });
  });
});
