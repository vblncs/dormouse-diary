// Panel for one hour: its energy level (a shortcut for the chart) and its activity.
// Like the rest of the app it saves automatically:
// whatever is typed is kept when the panel is closed or when moving to another hour.

import { frequentActivities } from "../analysis.js";
import { appendActivity, customActivities, getEntry, slotHours } from "../diary.js";
import { hourLabel } from "../dates.js";
import { LANGUAGES, TRANSLATIONS } from "../i18n/index.js";
import { LEVELS } from "../scale.js";
import { debounce, escapeHtml, hideToast, qs } from "./dom.js";

/** All built-in activity names in every language (so switching language doesn't make them "custom"). */
const BUILT_IN = LANGUAGES.flatMap((code) => TRANSLATIONS[code].acts.flatMap(([, items]) => items));

export function openActivitySheet(app, hour) {
  const root = qs("#sheet-root");
  let onKey = null;
  hideToast();

  function show(currentHour) {
    const { t } = app;
    const entry = getEntry(app.diary, app.dayKey, currentHour) ?? {};
    const hours = slotHours(app.diary.settings);
    const index = hours.indexOf(currentHour);
    const own = customActivities(app.diary, BUILT_IN, app.lang);
    const frequent = app.isSample ? [] : frequentActivities(app.diary);

    root.innerHTML = `<div class="overlay" id="overlay">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet-head hournav">
          <button class="iconbtn" id="sheet-prev" aria-label="${escapeHtml(t.prevHour)}" ${index <= 0 ? "disabled" : ""}>‹</button>
          <h3 id="sheet-title">${hourLabel(currentHour)} – ${hourLabel(currentHour + 1)}</h3>
          <button class="iconbtn" id="sheet-next" aria-label="${escapeHtml(t.nextHour)}" ${index >= hours.length - 1 ? "disabled" : ""}>›</button>
        </div>
        <div class="label"><span class="label-text" id="energy-q">${escapeHtml(t.energyQ)}</span></div>
        <div class="levels" role="group" aria-labelledby="energy-q">${LEVELS.map(
          (l) =>
            `<button type="button" class="level" data-level="${l.value}" aria-pressed="${entry.e === l.value}" aria-label="${escapeHtml(t.levelAria(l.value))}" style="background:${l.color};color:${l.textColor}">${app.legend.numbers ? l.value : ""}</button>`,
        ).join("")}</div>
        <div class="level-ends" aria-hidden="true"><span>${escapeHtml(t.bands[0][2])}</span><span>${escapeHtml(t.bands.at(-1)[2])}</span></div>
        <div class="label"><label for="activity-text">${escapeHtml(t.doing)}</label><span>${escapeHtml(t.doingHint)}</span></div>
        <input type="text" id="activity-text" value="${escapeHtml(entry.n ?? "")}" placeholder="${escapeHtml(t.doingPh)}" enterkeyhint="done">
        ${
          frequent.length
            ? `<div class="label"><span class="label-text">${escapeHtml(t.frequent)}</span><span>${escapeHtml(t.pickHint)}</span></div>
        <div class="chips">${frequent
          .map((a) => `<button type="button" class="chip" data-activity="${escapeHtml(a)}">${escapeHtml(a)}</button>`)
          .join("")}</div>`
            : ""
        }
        <div class="label"><label for="activity-pick">${escapeHtml(t.pickLabel)}</label>${
          frequent.length ? "" : `<span>${escapeHtml(t.pickHint)}</span>`
        }</div>
        <select id="activity-pick">
          <option value="">${escapeHtml(t.pickNone)}</option>
          ${own.length ? `<optgroup label="${escapeHtml(t.own)}">${own.map((a) => `<option>${escapeHtml(a)}</option>`).join("")}</optgroup>` : ""}
          ${t.acts
            .map(
              ([group, items]) =>
                `<optgroup label="${escapeHtml(group)}">${items.map((a) => `<option>${escapeHtml(a)}</option>`).join("")}</optgroup>`,
            )
            .join("")}
        </select>
        <div class="sheet-actions">
          <button class="btn link" id="sheet-clear-energy" ${entry.e ? "" : "hidden"}>${escapeHtml(t.removePoint)}</button>
          <span class="grow"></span>
          <button class="btn primary wide" id="sheet-done">${escapeHtml(t.done)}</button>
        </div>
        <p class="hint center-text">${escapeHtml(t.autosaved)}</p>
      </div>
    </div>`;

    const input = qs("#activity-text", root);

    /** Keeps what is typed; called whenever the panel is left or the hour changes. */
    const keep = () => {
      const text = input.value.trim();
      if (text !== (getEntry(app.diary, app.dayKey, currentHour)?.n ?? "")) {
        app.setActivity(currentHour, text, { render: false });
      }
    };
    // save while typing too, so nothing is lost if the phone locks or the app is closed mid-sentence
    const keepSoon = debounce(keep, 600);
    input.addEventListener("input", keepSoon);

    const goTo = (target) => {
      keep();
      show(target);
    };
    const done = () => {
      keep();
      close();
    };

    const levelButtons = [...root.querySelectorAll(".level")];
    const clearEnergy = qs("#sheet-clear-energy", root);
    levelButtons.forEach((button) =>
      button.addEventListener("click", () => {
        const level = Number(button.dataset.level);
        if (getEntry(app.diary, app.dayKey, currentHour)?.e === level) return;
        if (app.setEnergy(currentHour, level, { render: false })) {
          // the sample was replaced by an empty diary: show this hour of the new day, not the sample's text
          show(currentHour);
          return;
        }
        levelButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        clearEnergy.hidden = false;
      }),
    );

    root.querySelectorAll(".chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        input.value = appendActivity(input.value, chip.dataset.activity);
        keep();
      }),
    );
    qs("#activity-pick", root).addEventListener("change", (event) => {
      if (!event.target.value) return;
      input.value = appendActivity(input.value, event.target.value);
      event.target.value = "";
      keep();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      done();
    });
    qs("#sheet-prev", root).addEventListener("click", () => goTo(hours[index - 1]));
    qs("#sheet-next", root).addEventListener("click", () => goTo(hours[index + 1]));
    qs("#sheet-done", root).addEventListener("click", done);
    qs("#overlay", root).addEventListener("click", (event) => event.target.id === "overlay" && done());
    clearEnergy.addEventListener("click", () => {
      keep();
      app.beginUndoableChange();
      app.setEnergy(currentHour, null, { render: false });
      close();
      app.offerUndo();
    });

    if (onKey) document.removeEventListener("keydown", onKey);
    onKey = (event) => event.key === "Escape" && done();
    document.addEventListener("keydown", onKey);

    qs("#sheet-done", root).focus();
  }

  function close() {
    root.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    app.refresh();
  }

  show(hour);
}
