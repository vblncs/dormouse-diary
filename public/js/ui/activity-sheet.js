// Panel for the activity of one hour. Like the rest of the app it saves automatically:
// whatever is typed is kept when the panel is closed or when moving to another hour.

import { frequentActivities } from "../analysis.js";
import { appendActivity, customActivities, getEntry, slotHours } from "../diary.js";
import { hourLabel } from "../dates.js";
import { LANGUAGES, TRANSLATIONS } from "../i18n/index.js";
import { debounce, escapeHtml, hideToast, qs } from "./dom.js";

/** All built-in activity names in every language (so switching language doesn't make them "custom"). */
const BUILT_IN = LANGUAGES.flatMap((code) => TRANSLATIONS[code].acts.flatMap(([, items]) => items));

/** Suggestions while typing: the person's own activities first, then the built-in ones in their language. */
function suggestions(app) {
  const own = customActivities(app.diary, BUILT_IN, app.lang);
  return [...own, ...app.t.acts.flatMap(([, items]) => items)];
}

export function openActivitySheet(app, hour) {
  const root = qs("#sheet-root");
  let onKey = null;
  hideToast();

  function show(currentHour) {
    const { t } = app;
    const entry = getEntry(app.diary, app.dayKey, currentHour) ?? {};
    const hours = slotHours(app.diary.settings);
    const index = hours.indexOf(currentHour);
    const frequent = app.isSample ? [] : frequentActivities(app.diary);

    root.innerHTML = `<div class="overlay" id="overlay">
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="sheet-head hournav">
          <button class="iconbtn" id="sheet-prev" aria-label="${escapeHtml(t.prevHour)}" ${index <= 0 ? "disabled" : ""}>‹</button>
          <h3 id="sheet-title">${hourLabel(currentHour)} – ${hourLabel(currentHour + 1)}</h3>
          <button class="iconbtn" id="sheet-next" aria-label="${escapeHtml(t.nextHour)}" ${index >= hours.length - 1 ? "disabled" : ""}>›</button>
        </div>
        <div class="label"><label for="activity-text">${escapeHtml(t.doing)}</label></div>
        <input type="text" id="activity-text" value="${escapeHtml(entry.n ?? "")}" placeholder="${escapeHtml(t.doingPh)}" enterkeyhint="done" list="activity-suggestions" autocomplete="off">
        <datalist id="activity-suggestions">${suggestions(app)
          .map((a) => `<option value="${escapeHtml(a)}"></option>`)
          .join("")}</datalist>
        ${
          frequent.length
            ? `<div class="label"><span class="label-text">${escapeHtml(t.frequent)}</span><span>${escapeHtml(t.pickHint)}</span></div>
        <div class="chips">${frequent
          .map((a) => `<button type="button" class="chip" data-activity="${escapeHtml(a)}">${escapeHtml(a)}</button>`)
          .join("")}</div>`
            : ""
        }
        <div class="sheet-actions">
          ${entry.e ? `<button class="btn link" id="sheet-clear-energy">${escapeHtml(t.removePoint)}</button>` : ""}
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

    root.querySelectorAll(".chip").forEach((chip) =>
      chip.addEventListener("click", () => {
        input.value = appendActivity(input.value, chip.dataset.activity);
        keep();
      }),
    );
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      done();
    });
    qs("#sheet-prev", root).addEventListener("click", () => goTo(hours[index - 1]));
    qs("#sheet-next", root).addEventListener("click", () => goTo(hours[index + 1]));
    qs("#sheet-done", root).addEventListener("click", done);
    qs("#overlay", root).addEventListener("click", (event) => event.target.id === "overlay" && done());
    qs("#sheet-clear-energy", root)?.addEventListener("click", () => {
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
