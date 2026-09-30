// "Day" tab: the paper-style form — energy curve on top, activities underneath.

import { daySummary } from "../analysis.js";
import { getDay, getEntry, slotHours } from "../diary.js";
import { addDays, fromDateKey, hourLabel, slotLabel } from "../dates.js";
import { LEVELS, levelFor, levelToPercent, percentToLevel } from "../scale.js";
import { openActivitySheet } from "./activity-sheet.js";
import { escapeHtml, qs, qsa } from "./dom.js";
import { axisMarkup, axisWidth, bindLegendToggles, legendTogglesMarkup, valueMarkup } from "./legend.js";

/** Grid lines, curve, points and (invisible) keyboard targets of the chart. */
function plotMarkup(app, hours) {
  const day = getDay(app.diary, app.dayKey);
  const count = hours.length;
  const x = (i) => ((i + 0.5) / count) * 100;
  const grid = LEVELS.map((l) => `<div class="gl" style="top:${levelToPercent(l.value)}%"></div>`).join("");

  let points = "";
  const segments = [];
  let segment = [];
  hours.forEach((hour, i) => {
    const level = day.hours[hour]?.e;
    if (level) {
      segment.push(`${x(i).toFixed(2)},${levelToPercent(level).toFixed(2)}`);
      points += `<div class="pt" style="left:${x(i)}%;top:${levelToPercent(level)}%;background:${levelFor(level).color}"></div>`;
    } else if (segment.length) {
      segments.push(segment);
      segment = [];
    }
  });
  if (segment.length) segments.push(segment);

  const curve = `<svg class="curve" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${segments
    .map(
      (s) =>
        `<polyline points="${s.join(" ")}" fill="none" stroke="var(--fg)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>`,
    )
    .join("")}</svg>`;

  const keys = hours
    .map((hour, i) => {
      const label = app.t.colAria(hourLabel(hour), day.hours[hour]?.e);
      return `<button class="colkey" data-hour="${hour}" style="left:${(i / count) * 100}%;width:${100 / count}%" aria-label="${escapeHtml(label)}"></button>`;
    })
    .join("");

  return grid + curve + points + keys;
}

export function renderDayView(app, container) {
  const { t } = app;
  const hours = slotHours(app.diary.settings);
  const day = getDay(app.diary, app.dayKey);
  const summary = daySummary(app.diary, app.dayKey, hours);
  const isToday = app.dayKey === app.todayKey();

  container.innerHTML = `
    <div class="datenav">
      <button class="iconbtn" id="prev-day" aria-label="${escapeHtml(t.prevDay)}">‹</button>
      <div class="when"><strong>${escapeHtml(app.formatLongDate(app.dayKey))}</strong><span>${isToday ? escapeHtml(t.today) : fromDateKey(app.dayKey).getFullYear()}</span></div>
      <button class="iconbtn" id="next-day" aria-label="${escapeHtml(t.nextDay)}" ${isToday ? "disabled" : ""}>›</button>
    </div>
    ${isToday ? "" : `<p class="center"><button class="btn small" id="go-today">${escapeHtml(t.backToday)}</button></p>`}
    <div class="form">
      <p class="instr">${escapeHtml(t.instr)}</p>
      <div class="scroll formscroll">
        <div class="grid" style="grid-template-columns:${axisWidth(app.legend)} repeat(${hours.length}, minmax(68px, 1fr))">
          ${axisMarkup(app)}
          <div class="plot" id="plot" style="grid-column:2 / span ${hours.length};--n:${hours.length}">${plotMarkup(app, hours)}</div>
          <div class="corner"></div>
          ${hours.map((h) => `<div class="slot">${slotLabel(h)}</div>`).join("")}
          <div class="acthead"><span>${escapeHtml(t.activity)}</span></div>
          ${hours
            .map((h) => {
              const text = day.hours[h]?.n;
              return `<button class="actcell" data-hour="${h}" aria-label="${escapeHtml(t.actAria(hourLabel(h), text))}">${
                text ? escapeHtml(text) : `<span class="plus">+</span>`
              }</button>`;
            })
            .join("")}
        </div>
      </div>
      <p class="credit">${escapeHtml(t.credit)}</p>
    </div>
    ${legendTogglesMarkup(app, "day")}
    <div class="stats">
      <span>${escapeHtml(t.avg)} ${valueMarkup(app, summary.average, true)}</span>
      <span>${escapeHtml(t.lowest)} ${valueMarkup(app, summary.lowest)}</span>
      <span>${escapeHtml(t.highest)} ${valueMarkup(app, summary.highest)}</span>
      <span>${escapeHtml(t.filled)} <b>${summary.filled}/${hours.length}</b></span>
    </div>
    <div class="daynote">
      <label for="day-note">${escapeHtml(t.dayNote)}</label>
      <textarea id="day-note" placeholder="${escapeHtml(t.dayNotePh)}">${escapeHtml(day.note)}</textarea>
    </div>`;

  qs("#prev-day", container).addEventListener("click", () => app.showDay(addDays(app.dayKey, -1)));
  qs("#next-day", container).addEventListener("click", () => app.showDay(addDays(app.dayKey, 1)));
  qs("#go-today", container)?.addEventListener("click", () => app.showDay(app.todayKey()));
  qsa(".actcell", container).forEach((cell) =>
    cell.addEventListener("click", () => openActivitySheet(app, Number(cell.dataset.hour))),
  );
  qs("#day-note", container).addEventListener("change", (e) => app.updateNote(e.target.value));
  bindLegendToggles(app, "day", container);
  bindPlot(app, qs("#plot", container), hours);
}

/** Tap or drag in the chart to set levels; arrow keys on the focused column. */
function bindPlot(app, plot, hours) {
  let dragging = false;
  let last = "";

  const redrawPlot = () => {
    plot.innerHTML = plotMarkup(app, hours);
    bindKeys();
  };

  const applyPointer = (event) => {
    const rect = plot.getBoundingClientRect();
    const index = Math.floor(((event.clientX - rect.left) / rect.width) * hours.length);
    if (index < 0 || index >= hours.length) return;
    const level = percentToLevel(((event.clientY - rect.top) / rect.height) * 100);
    const signature = `${index}:${level}`;
    if (signature === last) return;
    last = signature;
    const leftSample = app.setEnergy(hours[index], level, { render: false });
    if (leftSample) {
      // the view now shows a different (empty) day: redraw everything
      dragging = false;
      app.render();
    } else {
      redrawPlot();
    }
  };

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    app.render(); // refresh summary and labels once the gesture is over
  };

  plot.addEventListener("pointerdown", (event) => {
    if (event.button > 0) return;
    dragging = true;
    last = "";
    applyPointer(event);
  });
  plot.addEventListener("pointermove", (event) => dragging && applyPointer(event));
  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => plot.addEventListener(type, endDrag));

  function bindKeys() {
    qsa(".colkey", plot).forEach((key) =>
      key.addEventListener("keydown", (event) => {
        const hour = Number(key.dataset.hour);
        const current = getEntry(app.diary, app.dayKey, hour)?.e;
        let level;
        if (event.key === "ArrowUp") level = Math.min(10, (current ?? 0) + 1);
        else if (event.key === "ArrowDown") level = Math.max(1, (current ?? 2) - 1);
        else if (event.key === "Delete" || event.key === "Backspace") level = null;
        else if (event.key === "Enter") {
          event.preventDefault();
          openActivitySheet(app, hour);
          return;
        } else return;
        event.preventDefault();
        app.setEnergy(hour, level);
        qs(`#plot .colkey[data-hour="${hour}"]`)?.focus();
      }),
    );
  }
  bindKeys();
}
