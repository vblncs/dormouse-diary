// Application controller: owns the state and is the only place that changes or saves it.

import { CLOCK_CHECK_MS, DEFAULT_RANGE, FILE_PREFIX } from "./config.js";
import { diaryToCsv } from "./csv.js";
import { addDays, formatDecimal, formatLongDate, formatShortDate, toDateKey } from "./dates.js";
import {
  createEmptyDiary,
  createSampleDiary,
  currentSlot,
  mergeDiaries,
  normalizeDiary,
  setActivity,
  setDayWindow,
  setEnergy,
  setNote,
} from "./diary.js";
import { readJsonFile, saveTextFile } from "./files.js";
import { detectLanguage, getTranslation } from "./i18n/index.js";
import { shouldRemindBackup, snoozeUntil } from "./reminders.js";
import {
  clearDiary,
  loadDiary,
  loadLanguage,
  loadPrefs,
  requestPersistentStorage,
  saveDiary,
  saveLanguage,
  savePrefs,
} from "./storage.js";
import { refreshDayView, renderDayView } from "./ui/day-view.js";
import { qs, showToast } from "./ui/dom.js";
import { openSettings } from "./ui/settings-sheet.js";
import { renderTrendsView } from "./ui/trends-view.js";

export class DiaryApp {
  /**
   * @param {object} options
   * @param {Storage|null} options.storage  where the diary is kept (null = nothing is saved)
   * @param {readonly string[]} options.preferredLanguages  e.g. navigator.languages
   * @param {() => Date} [options.now]
   */
  constructor({ storage, preferredLanguages, now = () => new Date() }) {
    this.storage = storage;
    this.now = now;
    this.lang = loadLanguage(storage) ?? detectLanguage(preferredLanguages);
    this.t = getTranslation(this.lang);
    /** Display preferences and backup bookkeeping (kept outside the diary). */
    this.prefs = loadPrefs(storage);

    const saved = loadDiary(storage);
    this.isSample = !saved;
    this.diary = saved ?? createSampleDiary(this.t, toDateKey(now()));
    this.dayKey = this.isSample ? addDays(this.todayKey(), -1) : this.todayKey();
    this.tab = "day";
    this.range = DEFAULT_RANGE;
    /** Legends are a viewing aid: hidden on every visit, never saved. */
    this.legend = { numbers: false, words: false };
    this.saveFailed = false;
    /** Copy of the diary taken before a chart gesture, so it can be undone. */
    this.undoSnapshot = null;
    this.persistenceRequested = false;
    /** Today and the current hour as last drawn, to notice when the clock moves on. */
    this.clock = null;
  }

  /* ---------- helpers for views ---------- */

  /** The diary day we are in now (after midnight, still the previous day until the diary day ends). */
  todayKey() {
    return currentSlot(this.diary?.settings ?? { start: 0, end: 23 }, this.now()).dateKey;
  }
  /** The slot of "now" if the open day is today, else null. */
  currentHour() {
    const slot = currentSlot(this.diary.settings, this.now());
    return slot.dateKey === this.dayKey ? slot.hour : null;
  }
  /** Last day shown on the trends tab (sample data ends yesterday). */
  rangeEndKey() {
    return this.isSample ? addDays(this.todayKey(), -1) : this.todayKey();
  }
  formatLongDate(key) {
    return formatLongDate(key, this.lang);
  }
  formatShortDate(key) {
    return formatShortDate(key, this.lang);
  }
  formatDecimal(value) {
    return formatDecimal(value, this.lang);
  }
  formatDate(isoTimestamp) {
    return new Intl.DateTimeFormat(this.lang, { day: "numeric", month: "long", year: "numeric" }).format(
      new Date(isoTimestamp),
    );
  }
  /** The diary has real entries (not the sample). */
  hasData() {
    return !this.isSample && Object.keys(this.diary.days).length > 0;
  }
  showBackupReminder() {
    return shouldRemindBackup(
      { hasData: this.hasData(), lastBackup: this.prefs.lastBackup, snoozedUntil: this.prefs.reminderSnoozedUntil },
      this.now(),
    );
  }
  notify(message, action) {
    showToast(message, action);
  }

  /* ---------- lifecycle ---------- */

  start() {
    qs("#tab-day").addEventListener("click", () => this.setTab("day"));
    qs("#tab-trends").addEventListener("click", () => this.setTab("trends"));
    qs("#open-settings").addEventListener("click", () => openSettings(this));
    // the description of the app is shown on request, to leave the screen to the form
    qs("#about-toggle").addEventListener("click", (event) => {
      const subtitle = qs("#app-subtitle");
      subtitle.hidden = !subtitle.hidden;
      event.currentTarget.setAttribute("aria-expanded", String(!subtitle.hidden));
    });
    qs("#start-diary").addEventListener("click", () => {
      this.leaveSample();
      this.render();
      this.notify(this.t.ready);
    });
    // an installed app can stay open for days: follow the clock when it comes back and while it is shown
    document.addEventListener("visibilitychange", () => document.hidden || this.followClock());
    window.addEventListener("focus", () => this.followClock());
    setInterval(() => document.hidden || this.followClock(), CLOCK_CHECK_MS);
    this.render();
  }

  /** "today" and "now" as they should be on screen. */
  clockState() {
    return { today: this.todayKey(), hour: currentSlot(this.diary.settings, this.now()).hour };
  }

  /**
   * Moves to the new day if the day shown was "today", and redraws when the hour changed.
   * Waits while the person is busy (a panel is open, a field has focus or a chart gesture is under way),
   * so nothing they are doing is lost.
   */
  followClock() {
    const { today, hour } = this.clockState();
    if (!this.clock || (this.clock.today === today && this.clock.hour === hour)) return;
    const active = document.activeElement;
    const busy =
      this.undoSnapshot != null ||
      qs("#sheet-root").childElementCount > 0 ||
      active?.matches?.("input, textarea, select");
    if (busy) return;
    const shownToday = this.isSample ? addDays(this.clock.today, -1) : this.clock.today;
    if (this.dayKey === shownToday) this.dayKey = this.isSample ? addDays(today, -1) : today;
    this.render();
  }

  render() {
    const { t } = this;
    this.clock = this.clockState();
    const root = document.documentElement;
    root.lang = this.lang;
    root.dataset.palette = this.prefs.palette;
    root.dataset.textSize = this.prefs.textSize;
    document.title = t.docTitle;
    qs("#app-title").textContent = t.title;
    qs("#app-tagline").textContent = t.tagline;
    qs("#app-subtitle").textContent = t.sub;
    qs("#about-toggle").setAttribute("aria-label", t.aboutApp);
    qs("#about-toggle").title = t.aboutApp;
    qs("#open-settings").setAttribute("aria-label", t.settings);
    qs("#open-settings").title = t.settings;
    qs("#tab-day").textContent = t.tabDay;
    qs("#tab-trends").textContent = t.tabTrend;
    qs("#tab-day").setAttribute("aria-selected", String(this.tab === "day"));
    qs("#tab-trends").setAttribute("aria-selected", String(this.tab === "trends"));
    qs("#sample-banner").hidden = !this.isSample;
    qs("#sample-title").textContent = t.demoB;
    qs("#sample-text").textContent = t.demo;
    qs("#start-diary").textContent = t.startReal;

    const dayView = qs("#view-day");
    const trendsView = qs("#view-trends");
    dayView.hidden = this.tab !== "day";
    trendsView.hidden = this.tab !== "trends";
    if (this.tab === "day") renderDayView(this, dayView);
    else renderTrendsView(this, trendsView);
  }

  /** After an edit: updates the open view in place when possible (keeps scroll and focus), else renders. */
  refresh() {
    if (this.tab !== "day" || !refreshDayView(this, qs("#view-day"))) this.render();
  }

  /* ---------- navigation and view options ---------- */

  setTab(tab) {
    this.tab = tab;
    this.render();
    window.scrollTo(0, 0);
  }

  showDay(key, { render = true } = {}) {
    if (key > this.todayKey()) return;
    this.dayKey = key;
    if (render) this.render();
  }

  setRange(days) {
    this.range = days;
    this.render();
  }

  setLegend(changes) {
    Object.assign(this.legend, changes);
    this.render();
  }

  /** Changes display preferences or backup bookkeeping. */
  setPrefs(changes, { render = true } = {}) {
    Object.assign(this.prefs, changes);
    savePrefs(this.storage, this.prefs);
    if (render) this.render();
  }

  snoozeBackupReminder() {
    this.setPrefs({ reminderSnoozedUntil: snoozeUntil(this.now()) });
  }

  setLanguage(code) {
    this.lang = code;
    this.t = getTranslation(code);
    saveLanguage(this.storage, code);
    if (this.isSample) this.diary = createSampleDiary(this.t, toDateKey(this.now()));
    this.render();
  }

  /* ---------- editing ---------- */

  /** Replaces the sample data with an empty diary starting today. */
  leaveSample() {
    if (!this.isSample) return false;
    this.isSample = false;
    this.diary = createEmptyDiary();
    this.dayKey = this.todayKey();
    this.save();
    return true;
  }

  /**
   * Runs a change on the diary: leaves sample mode first, saves, then re-renders.
   * @returns {boolean} true if sample mode was left (the day on screen changed)
   */
  edit(change, { render = true } = {}) {
    const leftSample = this.leaveSample();
    change(this.diary, this.dayKey);
    this.save();
    if (leftSample) this.render();
    else if (render) this.refresh();
    return leftSample;
  }

  setEnergy(hour, level, options) {
    return this.edit((diary, key) => setEnergy(diary, key, hour, level), options);
  }

  setActivity(hour, text, options) {
    return this.edit((diary, key) => setActivity(diary, key, hour, text), options);
  }

  updateNote(note) {
    return this.edit((diary, key) => setNote(diary, key, note), { render: false });
  }

  setDayWindow(start, endExclusive) {
    return this.edit((diary) => setDayWindow(diary, start, endExclusive));
  }

  /* ---------- undo (for taps and drags on the chart) ---------- */

  /** Call before a chart gesture starts. */
  beginUndoableChange() {
    this.undoSnapshot = this.isSample ? null : structuredClone(this.diary);
  }

  /** Call when the gesture ends: offers "Undo" if something actually changed. */
  offerUndo() {
    const before = this.undoSnapshot;
    this.undoSnapshot = null;
    if (!before || JSON.stringify(before) === JSON.stringify(this.diary)) return;
    this.notify(this.t.energyChanged, {
      label: this.t.undo,
      onClick: () => {
        this.diary = before;
        this.save();
        this.refresh();
        this.notify(this.t.undone);
      },
    });
  }

  save() {
    if (this.isSample || !this.storage) return;
    const ok = saveDiary(this.storage, this.diary);
    if (!ok && !this.saveFailed) this.notify(this.t.storageFail);
    this.saveFailed = !ok;
    if (ok && !this.persistenceRequested) {
      this.persistenceRequested = true;
      requestPersistentStorage();
    }
  }

  deleteAll() {
    clearDiary(this.storage);
    this.isSample = false;
    this.diary = createEmptyDiary();
    this.dayKey = this.todayKey();
    this.notify(this.t.wiped);
    this.render();
  }

  /* ---------- import / export ---------- */

  async exportCsv() {
    await this.offerFile(`${FILE_PREFIX}-${this.todayKey()}.csv`, diaryToCsv(this.diary, this.t));
  }

  async exportBackup() {
    const result = await this.offerFile(
      `${FILE_PREFIX}-backup-${this.todayKey()}.json`,
      JSON.stringify(this.diary, null, 1),
    );
    if (result === "downloaded" || result === "saved") {
      this.setPrefs({ lastBackup: this.now().toISOString(), reminderSnoozedUntil: null });
    }
    return result;
  }

  async offerFile(filename, content) {
    const result = await saveTextFile(filename, content);
    const messages = {
      downloaded: this.t.downloaded,
      saved: this.t.saved,
      busy: this.t.wait,
      copied: this.t.copied,
      unavailable: this.t.noDownload,
    };
    if (messages[result]) this.notify(messages[result]);
    return result;
  }

  /** Reads and validates a backup file; null (with a message) if it is not a diary backup. */
  async readBackup(file) {
    try {
      return normalizeDiary(await readJsonFile(file));
    } catch {
      this.notify(this.t.badFile);
      return null;
    }
  }

  /** Adds a backup read by readBackup() to the diary, never changing what is already there. */
  mergeBackup(backup) {
    const { diary, stats } = mergeDiaries(this.diary, backup);
    this.diary = diary;
    this.save();
    this.notify(this.t.merged(stats) || this.t.mergedNothing);
    this.render();
  }

  /** Replaces the diary with a backup read by readBackup(). */
  applyBackup(diary) {
    this.diary = diary;
    this.isSample = false;
    this.dayKey = this.todayKey();
    this.save();
    this.notify(this.t.restored);
    this.render();
  }
}
