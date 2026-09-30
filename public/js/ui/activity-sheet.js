// Bottom sheet for choosing or typing the activity of one hour.

import { appendActivity, customActivities, getEntry, slotHours } from "../diary.js";
import { hourLabel } from "../dates.js";
import { LANGUAGES, TRANSLATIONS } from "../i18n/index.js";
import { escapeHtml, qs } from "./dom.js";

/** All built-in activity names in every language (so switching language doesn't make them "custom"). */
const BUILT_IN = LANGUAGES.flatMap((code) => TRANSLATIONS[code].acts.flatMap(([, items]) => items));

export function openActivitySheet(app, hour) {
  const { t } = app;
  const root = qs("#sheet-root");
  const entry = getEntry(app.diary, app.dayKey, hour) ?? {};
  const hours = slotHours(app.diary.settings);
  const isLast = hour >= hours[hours.length - 1];
  const own = customActivities(app.diary, BUILT_IN, app.lang);

  root.innerHTML = `<div class="overlay" id="overlay">
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="sheet-head">
        <h3 id="sheet-title">${hourLabel(hour)} – ${hourLabel(hour + 1)}</h3>
        <button class="btn small" id="sheet-close">${escapeHtml(t.close)}</button>
      </div>
      <div class="label"><label for="activity-pick">${escapeHtml(t.pickLabel)}</label><span>${escapeHtml(t.pickHint)}</span></div>
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
      <div class="label"><label for="activity-text">${escapeHtml(t.doing)}</label><span>${escapeHtml(t.doingHint)}</span></div>
      <input type="text" id="activity-text" value="${escapeHtml(entry.n ?? "")}" placeholder="${escapeHtml(t.doingPh)}">
      <div class="sheet-actions">
        ${entry.e ? `<button class="btn" id="sheet-clear-energy">${escapeHtml(t.removePoint)}</button>` : ""}
        <span class="grow"></span>
        <button class="btn" id="sheet-save">${escapeHtml(t.save)}</button>
        ${isLast ? "" : `<button class="btn primary" id="sheet-next">${escapeHtml(t.saveNext)}</button>`}
      </div>
    </div>
  </div>`;

  const input = qs("#activity-text", root);
  const close = () => {
    root.innerHTML = "";
    document.removeEventListener("keydown", onKey);
    app.render();
  };
  const save = () => {
    const text = input.value.trim();
    if (text !== (entry.n ?? "")) app.setActivity(hour, text, { render: false });
  };
  const onKey = (event) => event.key === "Escape" && close();
  document.addEventListener("keydown", onKey);

  qs("#activity-pick", root).addEventListener("change", (event) => {
    if (!event.target.value) return;
    input.value = appendActivity(input.value, event.target.value);
    event.target.value = "";
    input.focus();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    save();
    close();
  });
  qs("#sheet-close", root).addEventListener("click", close);
  qs("#overlay", root).addEventListener("click", (event) => event.target.id === "overlay" && close());
  qs("#sheet-save", root).addEventListener("click", () => {
    save();
    close();
  });
  qs("#sheet-next", root)?.addEventListener("click", () => {
    save();
    close();
    openActivitySheet(app, hour + 1);
  });
  qs("#sheet-clear-energy", root)?.addEventListener("click", () => {
    app.setEnergy(hour, null, { render: false });
    close();
  });
  qs("#activity-pick", root).focus();
}
