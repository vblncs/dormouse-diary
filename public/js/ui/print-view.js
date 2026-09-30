// PDF export: prints the paper form of the chosen days, one day per page. The person chooses
// "Save as PDF" in the print dialog, so no PDF library (and no network) is needed.

import { daysWithEntries } from "../analysis.js";
import { formatFullDate, slotLabel } from "../dates.js";
import { getDay, slotHours } from "../diary.js";
import { pdfFileName } from "../files.js";
import { chartMarkup } from "./day-view.js";
import { escapeHtml, qs } from "./dom.js";
import { axisMarkup, axisWidth } from "./legend.js";

/** One day on one page, laid out like the form on screen (and the paper worksheet). */
function dayPage(app, hours, key) {
  const { t } = app;
  const day = getDay(app.diary, key);
  const count = hours.length;
  return `<section class="print-day">
    <header class="print-head">
      <h2>${escapeHtml(formatFullDate(key, app.lang))}</h2>
      <span>${escapeHtml(t.title)} – ${escapeHtml(t.tagline)}</span>
    </header>
    <div class="grid" style="grid-template-columns:${axisWidth(app.legend)} repeat(${count}, minmax(0, 1fr))">
      ${axisMarkup(app)}
      <div class="plot" style="grid-column:2 / span ${count};--n:${count}">${chartMarkup(app, hours, key)}</div>
      <div class="corner"></div>
      ${hours.map((h) => `<div class="slot">${slotLabel(h)}</div>`).join("")}
      <div class="acthead"><span>${escapeHtml(t.activity)}</span></div>
      ${hours.map((h) => `<div class="actcell">${escapeHtml(day.hours[h]?.n ?? "")}</div>`).join("")}
    </div>
    ${day.note ? `<p class="print-note"><b>${escapeHtml(t.dayNote)}:</b> ${escapeHtml(day.note)}</p>` : ""}
    <footer class="print-foot">${escapeHtml(t.credit)}</footer>
  </section>`;
}

/**
 * Opens the print dialog with the given days, leaving out days without entries.
 * The scale legends are printed as they are shown on screen.
 * @returns {boolean} whether the print dialog was opened
 */
export function printDays(app, keys) {
  const days = daysWithEntries(app.diary, [...keys].sort());
  if (!days.length) {
    app.notify(app.t.pdfNothing);
    return false;
  }
  if (typeof window.print !== "function") {
    app.notify(app.t.pdfUnavailable);
    return false;
  }
  const hours = slotHours(app.diary.settings);
  // stays in the page (hidden on screen) until the next export: some browsers print asynchronously
  qs("#print-root").innerHTML = days.map((key) => dayPage(app, hours, key)).join("");
  const title = document.title;
  document.title = pdfFileName(days); // the print dialog suggests the title as the file name
  window.addEventListener("afterprint", () => (document.title = title), { once: true });
  window.print();
  return true;
}
