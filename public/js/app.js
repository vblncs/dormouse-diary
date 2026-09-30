// Application controller: owns the state and is the only place that changes or saves it.

import { DEFAULT_RANGE } from "./config.js";
import { diaryToCsv } from "./csv.js";
import { addDays, formatDecimal, formatLongDate, formatShortDate, todayKey } from "./dates.js";
import {
  createEmptyDiary,
  createSampleDiary,
  normalizeDiary,
  setActivity,
  setDayWindow,
  setEnergy,
  setNote,
} from "./diary.js";
import { readJsonFile, saveTextFile } from "./files.js";
import { LANGUAGE_NAMES, LANGUAGES, detectLanguage, getTranslation } from "./i18n/index.js";
import { clearDiary, loadDiary, loadLanguage, saveDiary, saveLanguage } from "./storage.js";
import { renderDayView } from "./ui/day-view.js";
import { escapeHtml, qs, showToast } from "./ui/dom.js";
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

    const saved = loadDiary(storage);
    this.isSample = !saved;
    this.diary = saved ?? createSampleDiary(this.t, this.todayKey());
    this.dayKey = this.isSample ? addDays(this.todayKey(), -1) : this.todayKey();
    this.tab = "day";
    this.range = DEFAULT_RANGE;
    /** Legends are a viewing aid: hidden on every visit, never saved. */
    this.legend = { numbers: false, words: false };
    this.saveFailed = false;
  }

  /* ---------- helpers for views ---------- */

  todayKey() {
    return todayKey(this.now());
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
  notify(message) {
    showToast(message);
  }

  /* ---------- lifecycle ---------- */

  start() {
    const picker = qs("#language");
    picker.innerHTML = LANGUAGES.map(
      (code) => `<option value="${code}">${escapeHtml(LANGUAGE_NAMES[code])}</option>`,
    ).join("");
    picker.addEventListener("change", (e) => this.setLanguage(e.target.value));
    qs("#tab-day").addEventListener("click", () => this.setTab("day"));
    qs("#tab-trends").addEventListener("click", () => this.setTab("trends"));
    qs("#start-diary").addEventListener("click", () => {
      this.leaveSample();
      this.render();
      this.notify(this.t.ready);
    });
    this.render();
  }

  render() {
    const { t } = this;
    document.documentElement.lang = this.lang;
    document.title = t.docTitle;
    qs("#app-title").textContent = t.title;
    qs("#app-subtitle").textContent = t.sub;
    qs("#language-label").textContent = t.language;
    qs("#language").value = this.lang;
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

  setLanguage(code) {
    this.lang = code;
    this.t = getTranslation(code);
    saveLanguage(this.storage, code);
    if (this.isSample) this.diary = createSampleDiary(this.t, this.todayKey());
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
    if (render || leftSample) this.render();
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

  save() {
    if (this.isSample || !this.storage) return;
    const ok = saveDiary(this.storage, this.diary);
    if (!ok && !this.saveFailed) this.notify(this.t.storageFail);
    this.saveFailed = !ok;
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
    await this.offerFile(`${this.t.filePrefix}-${this.todayKey()}.csv`, diaryToCsv(this.diary, this.t));
  }

  async exportBackup() {
    await this.offerFile(`${this.t.filePrefix}-backup-${this.todayKey()}.json`, JSON.stringify(this.diary, null, 1));
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
  }

  async importBackup(file) {
    try {
      this.diary = normalizeDiary(await readJsonFile(file));
    } catch {
      this.notify(this.t.badFile);
      return;
    }
    this.isSample = false;
    this.save();
    this.notify(this.t.restored);
    this.render();
  }
}
