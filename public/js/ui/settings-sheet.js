// Settings panel (gear button in the header): language, display, diary hours, data management, about.

import { APP_VERSION } from "../config.js";
import { RANGE_OPTIONS } from "../config.js";
import { slotHours } from "../diary.js";
import { dayRange, hourLabel } from "../dates.js";
import { LANGUAGE_NAMES, LANGUAGES } from "../i18n/index.js";
import { isStandalone, persistenceAdvice, storagePersisted } from "../storage.js";
import { escapeHtml, hideToast, qs, qsa } from "./dom.js";
import { printDays } from "./print-view.js";

/** A group of radio buttons rendered as large, easy-to-tap options. */
function choiceGroup(name, options, current) {
  return `<div class="choices" role="radiogroup">${options
    .map(
      ([value, label]) =>
        `<label class="choice"><input type="radio" name="${name}" value="${value}" ${value === current ? "checked" : ""}><span>${escapeHtml(label)}</span></label>`,
    )
    .join("")}</div>`;
}

/**
 * Says in plain words whether the browser promised to keep the diary, and how to protect it if not.
 * Shows nothing where the browser cannot tell (as before this existed).
 */
async function showPersistence(zone, t) {
  const advice = persistenceAdvice({ persisted: await storagePersisted(), standalone: isStandalone() });
  if (!zone.isConnected || advice === "unknown") return; // the panel may have been redrawn or closed meanwhile
  if (advice === "granted") {
    zone.innerHTML = `<p class="hint persist-ok">✓ ${escapeHtml(t.persistYes)}</p>`;
    return;
  }
  const install =
    advice === "install"
      ? `<p class="hint">${escapeHtml(t.installTip)}</p>
        <ul class="hint steps">
          <li>${escapeHtml(t.installIphone)} ${escapeHtml(t.installIphoneNote)}</li>
          <li>${escapeHtml(t.installAndroid)}</li>
        </ul>`
      : "";
  zone.innerHTML = `<p class="hint">${escapeHtml(t.persistNo)}</p>${install}`;
}

export function openSettings(app) {
  const root = qs("#sheet-root");
  const opener = document.activeElement;
  hideToast();

  const onKey = (event) => event.key === "Escape" && close();
  function close() {
    root.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    app.render();
    opener?.focus?.();
  }
  document.addEventListener("keydown", onKey);
  /** Days for the PDF export: "day" (the one shown) or a number of days up to today. */
  let pdfRange = "day";

  function draw(focusSelector) {
    const { t } = app;
    const { start, end } = app.diary.settings;
    const startOptions = Array.from(
      { length: 24 },
      (_, h) => `<option value="${h}" ${h === start ? "selected" : ""}>${hourLabel(h)}</option>`,
    ).join("");
    const endOptions = Array.from({ length: 24 }, (_, i) => {
      const value = start + 1 + i; // exclusive end: the moment the last slot finishes
      const suffix = value >= 24 ? ` ${escapeHtml(t.nextDayShort)}` : "";
      return `<option value="${value}" ${value === end + 1 ? "selected" : ""}>${hourLabel(value)}${suffix}</option>`;
    }).join("");
    const lastBackup = app.prefs.lastBackup ? t.lastBackupOn(app.formatDate(app.prefs.lastBackup)) : t.lastBackupNever;

    root.innerHTML = `<div class="overlay" id="overlay">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="sheet-head">
          <h3 id="settings-title">${escapeHtml(t.settings)}</h3>
          <button class="btn small primary" id="settings-done">${escapeHtml(t.done)}</button>
        </div>

        <section class="setting">
          <h4><label for="settings-language">${escapeHtml(t.language)}</label></h4>
          <select id="settings-language">${LANGUAGES.map(
            (code) =>
              `<option value="${code}" ${code === app.lang ? "selected" : ""}>${escapeHtml(LANGUAGE_NAMES[code])}</option>`,
          ).join("")}</select>
        </section>

        <section class="setting">
          <h4>${escapeHtml(t.displayTitle)}</h4>
          <p class="hint">${escapeHtml(t.paletteLabel)}</p>
          ${choiceGroup(
            "palette",
            [
              ["standard", t.paletteStandard],
              ["colorblind", t.paletteColorblind],
            ],
            app.prefs.palette,
          )}
          <p class="hint">${escapeHtml(t.textSizeLabel)}</p>
          ${choiceGroup(
            "textSize",
            [
              ["normal", t.textNormal],
              ["large", t.textLarge],
            ],
            app.prefs.textSize,
          )}
        </section>

        <section class="setting">
          <h4>${escapeHtml(t.hoursTitle)}</h4>
          <p class="hint">${escapeHtml(t.hoursHint)}</p>
          <div class="settings">
            <label>${escapeHtml(t.dayStart)}<select id="settings-start">${startOptions}</select></label>
            <label>${escapeHtml(t.dayEnd)}<select id="settings-end">${endOptions}</select></label>
          </div>
          <p class="hint">${escapeHtml(t.slotsCount(slotHours(app.diary.settings).length))}</p>
        </section>

        <section class="setting">
          <h4>${escapeHtml(t.dataTitle)}</h4>
          <p class="hint">${escapeHtml(t.dataSub)}</p>
          <p class="hint"><b>${escapeHtml(lastBackup)}</b></p>
          <div class="tools">
            <button class="btn primary" id="export-backup">${escapeHtml(t.saveBackup)}</button>
            <button class="btn" id="export-pdf" aria-expanded="false" aria-controls="pdf-zone">${escapeHtml(t.expPdf)}</button>
            <button class="btn" id="export-csv">${escapeHtml(t.expCsv)}</button>
            <label class="btn" for="import-backup">${escapeHtml(t.restore)}</label>
            <input type="file" id="import-backup" accept=".json,application/json" hidden>
          </div>
          <div id="pdf-zone" class="confirm choice-box" hidden>
            <p class="hint">${escapeHtml(t.pdfDays)}</p>
            ${choiceGroup("pdfRange", [["day", t.pdfThisDay], ...RANGE_OPTIONS.map((n) => [String(n), t.nDays(n)])], pdfRange)}
            <button class="btn primary" id="pdf-create">${escapeHtml(t.pdfCreate)}</button>
            <p class="hint">${escapeHtml(t.pdfHint)}</p>
          </div>
          <div id="restore-zone"></div>
          <div id="wipe-zone" class="wipe"><button class="btn small danger" id="wipe">${escapeHtml(t.wipe)}</button></div>
          <div id="persist-zone" class="persist"></div>
        </section>

        <section class="setting">
          <h4>${escapeHtml(t.aboutTitle)}</h4>
          <p><b>${escapeHtml(t.title)}</b> – ${escapeHtml(t.tagline)} · ${escapeHtml(t.versionLabel(APP_VERSION))}</p>
          <p class="hint">${escapeHtml(t.aboutText)}</p>
          <p><a href="privacy.html?lang=${app.lang}">${escapeHtml(t.privacyLink)}</a></p>
        </section>
      </div>
    </div>`;

    qs("#settings-done", root).addEventListener("click", close);
    qs("#overlay", root).addEventListener("click", (e) => e.target.id === "overlay" && close());

    qs("#settings-language", root).addEventListener("change", (e) => {
      app.setLanguage(e.target.value);
      draw("#settings-language");
    });
    for (const name of ["palette", "textSize"]) {
      qsa(`input[name="${name}"]`, root).forEach((radio) =>
        radio.addEventListener("change", () => {
          app.setPrefs({ [name]: radio.value });
          draw(`input[name="${name}"][value="${radio.value}"]`);
        }),
      );
    }

    const startSelect = qs("#settings-start", root);
    startSelect.addEventListener("change", () => {
      // keep the same number of hours when only the start moves
      const length = app.diary.settings.end - app.diary.settings.start + 1;
      app.setDayWindow(Number(startSelect.value), Number(startSelect.value) + length);
      draw("#settings-start");
    });
    qs("#settings-end", root).addEventListener("change", (e) => {
      app.setDayWindow(app.diary.settings.start, Number(e.target.value));
      draw("#settings-end");
    });

    qs("#export-csv", root).addEventListener("click", () => app.exportCsv());
    const pdfZone = qs("#pdf-zone", root);
    qs("#export-pdf", root).addEventListener("click", (event) => {
      pdfZone.hidden = !pdfZone.hidden;
      event.currentTarget.setAttribute("aria-expanded", String(!pdfZone.hidden));
    });
    qsa('input[name="pdfRange"]', root).forEach((radio) =>
      radio.addEventListener("change", () => (pdfRange = radio.value)),
    );
    qs("#pdf-create", root).addEventListener("click", () => {
      const keys = pdfRange === "day" ? [app.dayKey] : dayRange(app.rangeEndKey(), Number(pdfRange));
      printDays(app, keys);
    });
    qs("#export-backup", root).addEventListener("click", async () => {
      await app.exportBackup();
      draw("#export-backup"); // show the new "last backup" date
    });
    qs("#import-backup", root).addEventListener("change", async (e) => {
      const file = e.target.files[0];
      e.target.value = ""; // allow choosing the same file again
      if (!file) return;
      const backup = await app.readBackup(file);
      if (!backup) return;
      if (!app.hasData()) {
        app.applyBackup(backup);
        close();
        return;
      }
      // the diary already has entries: add to it (recommended) or replace it
      const zone = qs("#restore-zone", root);
      zone.innerHTML = `<div class="confirm choice-box"><p>${escapeHtml(t.importQ)}</p>
        <button class="btn primary" id="import-merge">${escapeHtml(t.importMerge)}</button>
        <p class="hint">${escapeHtml(t.importMergeHint)}</p>
        <div class="tools"><button class="btn" id="restore-cancel">${escapeHtml(t.cancel)}</button>
        <button class="btn danger" id="import-replace">${escapeHtml(t.importReplace)}</button></div></div>`;
      qs("#restore-cancel", zone).addEventListener("click", () => (zone.innerHTML = ""));
      qs("#import-merge", zone).addEventListener("click", () => {
        app.mergeBackup(backup);
        close();
      });
      qs("#import-replace", zone).addEventListener("click", () => {
        // replacing loses everything in the diary now: ask first
        zone.innerHTML = `<div class="confirm"><p>${escapeHtml(t.restoreQ)}</p>
          <div class="tools"><button class="btn" id="restore-cancel">${escapeHtml(t.cancel)}</button>
          <button class="btn danger-solid" id="restore-confirm">${escapeHtml(t.restoreYes)}</button></div></div>`;
        qs("#restore-cancel", zone).addEventListener("click", () => (zone.innerHTML = ""));
        qs("#restore-confirm", zone).addEventListener("click", () => {
          app.applyBackup(backup);
          close();
        });
        qs("#restore-cancel", zone).focus();
      });
      qs("#import-merge", zone).focus();
    });
    qs("#wipe", root).addEventListener("click", () => {
      const zone = qs("#wipe-zone", root);
      zone.innerHTML = `<div class="confirm"><p>${escapeHtml(t.wipeQ)}</p>
        <div class="tools"><button class="btn" id="wipe-cancel">${escapeHtml(t.cancel)}</button>
        <button class="btn danger-solid" id="wipe-confirm">${escapeHtml(t.wipeYes)}</button></div></div>`;
      qs("#wipe-cancel", zone).addEventListener("click", () => draw("#wipe"));
      qs("#wipe-confirm", zone).addEventListener("click", () => {
        app.deleteAll();
        close();
      });
      qs("#wipe-cancel", zone).focus();
    });

    showPersistence(qs("#persist-zone", root), t);
    qs(focusSelector ?? "#settings-done", root)?.focus();
  }

  draw();
}
