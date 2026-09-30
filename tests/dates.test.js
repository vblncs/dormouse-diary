import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, dayRange, formatDecimal, fromDateKey, hourLabel, slotLabel, toDateKey } from "../public/js/dates.js";

describe("date keys", () => {
  it("round-trips a date", () => {
    assert.equal(toDateKey(fromDateKey("2026-09-30")), "2026-09-30");
  });
  it("adds days across month and year ends", () => {
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  });
  it("handles the daylight-saving change (local time)", () => {
    assert.equal(addDays("2026-10-24", 1), "2026-10-25");
    assert.equal(addDays("2026-10-25", 1), "2026-10-26");
  });
  it("builds a range ending on a day, oldest first", () => {
    assert.deepEqual(dayRange("2026-09-30", 3), ["2026-09-28", "2026-09-29", "2026-09-30"]);
  });
});

describe("labels", () => {
  it("formats hours past midnight on the same diary day", () => {
    assert.equal(hourLabel(8), "08:00");
    assert.equal(hourLabel(24), "00:00");
    assert.equal(slotLabel(23), "23–00");
    assert.equal(slotLabel(24), "00–01");
  });
  it("uses the locale decimal separator", () => {
    assert.equal(formatDecimal(5.25, "en"), "5.3");
    assert.equal(formatDecimal(5.25, "it"), "5,3");
    assert.equal(formatDecimal(null, "it"), "–");
  });
});
