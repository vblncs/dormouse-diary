import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysSince, shouldRemindBackup, snoozeUntil } from "../public/js/reminders.js";

const now = new Date("2026-09-30T12:00:00Z");
const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString();

describe("backup reminder", () => {
  it("never reminds when there is nothing to lose", () => {
    assert.equal(shouldRemindBackup({ hasData: false, lastBackup: null, snoozedUntil: null }, now), false);
  });
  it("reminds when there has never been a backup", () => {
    assert.equal(shouldRemindBackup({ hasData: true, lastBackup: null, snoozedUntil: null }, now), true);
  });
  it("stays quiet for 14 days after a backup", () => {
    assert.equal(shouldRemindBackup({ hasData: true, lastBackup: daysAgo(13), snoozedUntil: null }, now), false);
    assert.equal(shouldRemindBackup({ hasData: true, lastBackup: daysAgo(14), snoozedUntil: null }, now), true);
  });
  it("respects 'Later' for 7 days", () => {
    const snoozed = snoozeUntil(now);
    assert.equal(shouldRemindBackup({ hasData: true, lastBackup: null, snoozedUntil: snoozed }, now), false);
    const inEightDays = new Date(now.getTime() + 8 * 86400000);
    assert.equal(shouldRemindBackup({ hasData: true, lastBackup: null, snoozedUntil: snoozed }, inEightDays), true);
  });
  it("counts whole days and ignores invalid timestamps", () => {
    assert.equal(daysSince(daysAgo(3), now), 3);
    assert.equal(daysSince(null, now), null);
    assert.equal(daysSince("not a date", now), null);
  });
});
