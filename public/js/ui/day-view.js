// "Day" tab: the paper-style form — energy curve on top, activities underneath.

import { getDay, getEntry, slotHours } from "../diary.js";
import { addDays, fromDateKey, hourLabel, slotLabel } from "../dates.js";
import { LEVELS, levelFor, levelToPercent, percentToLevel } from "../scale.js";
import { openActivitySheet } from "./activity-sheet.js";
import { debounce, escapeHtml, qs, qsa } from "./dom.js";
import { axisMarkup, axisWidth, bindLegendToggles, legendTogglesMarkup } from "./legend.js";

/** Grid lines, curve and points of one day's chart (also used for printing). */
export function chartMarkup(app, hours, key) {
  const day = getDay(app.diary, key);
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

  return grid + curve + points;
}

/** The open day's chart, with the current hour and (invisible) keyboard targets. */
function plotMarkup(app, hours) {
  const day = getDay(app.diary, app.dayKey);
  const count = hours.length;
  const keys = hours
    .map((hour, i) => {
      const label = app.t.colAria(hourLabel(hour), day.hours[hour]?.e);
      return `<button class="colkey" data-hour="${hour}" style="left:${(i / count) * 100}%;width:${100 / count}%" aria-label="${escapeHtml(label)}"></button>`;
    })
    .join("");

  const nowIndex = hours.indexOf(app.currentHour());
  const now =
    nowIndex < 0 ? "" : `<div class="nowcol" style="left:${(nowIndex / count) * 100}%;width:${100 / count}%"></div>`;

  return now + chartMarkup(app, hours, app.dayKey) + keys;
}

function actCellContent(text) {
  return text ? escapeHtml(text) : `<span class="plus">+</span>`;
}

/** What the structure of the view depends on: when it changes, the view must be rebuilt. */
function layoutKey(app, hours) {
  return [app.dayKey, hours.join(), app.showBackupReminder(), app.isSample].join("|");
}

/**
 * Updates the open view after an edit without rebuilding it, so scroll position, focus
 * and what a screen reader is reading are kept.
 * @returns {boolean} false if the view has to be rebuilt instead (other day, other hours…)
 */
export function refreshDayView(app, container) {
  const hours = slotHours(app.diary.settings);
  const plot = qs("#plot", container);
  if (!plot || container.dataset.layout !== layoutKey(app, hours)) return false;
  const { t } = app;
  const day = getDay(app.diary, app.dayKey);

  plot.innerHTML = plotMarkup(app, hours);
  qs(".instr", container).hidden = Object.keys(day.hours).length > 0;
  qsa(".actcell", container).forEach((cell) => {
    const hour = Number(cell.dataset.hour);
    const text = day.hours[hour]?.n;
    cell.innerHTML = actCellContent(text);
    cell.setAttribute("aria-label", t.actAria(hourLabel(hour), text));
  });
  return true;
}

export function renderDayView(app, container) {
  const { t } = app;
  const hours = slotHours(app.diary.settings);
  const day = getDay(app.diary, app.dayKey);
  const isToday = app.dayKey === app.todayKey();
  const nowHour = app.currentHour();
  const isEmpty = !Object.keys(day.hours).length;
  // rebuilt on the same day (e.g. after an undo): keep the form scrolled where the person left it
  const previousScroll = qs(".formscroll", container)?.scrollLeft ?? 0;

  const reminder = app.showBackupReminder()
    ? `<div class="banner reminder" role="status">
        <p>${escapeHtml(t.backupReminder)}</p>
        <div class="tools">
          <button class="btn primary" id="reminder-backup">${escapeHtml(t.saveBackup)}</button>
          <button class="btn" id="reminder-later">${escapeHtml(t.later)}</button>
        </div>
      </div>`
    : "";

  container.innerHTML = `
    ${reminder}
    <div class="datenav">
      <button class="iconbtn" id="prev-day" aria-label="${escapeHtml(t.prevDay)}">‹</button>
      <label class="when" title="${escapeHtml(t.pickDate)}">
        <strong>${escapeHtml(app.formatLongDate(app.dayKey))} <span class="caret" aria-hidden="true">▾</span></strong>
        <span>${isToday ? escapeHtml(t.today) : fromDateKey(app.dayKey).getFullYear()}</span>
        <input type="date" id="pick-date" class="date-overlay" value="${app.dayKey}" max="${app.todayKey()}" aria-label="${escapeHtml(t.pickDate)}">
      </label>
      <button class="iconbtn" id="next-day" aria-label="${escapeHtml(t.nextDay)}" ${isToday ? "disabled" : ""}>›</button>
    </div>
    ${isToday ? "" : `<p class="center"><button class="btn small" id="go-today">${escapeHtml(t.backToday)}</button></p>`}
    <div class="form">
      ${legendTogglesMarkup(app, "day")}
      <p class="instr" ${isEmpty ? "" : "hidden"}>${escapeHtml(t.instr)}</p>
      <div class="scroll formscroll">
        <div class="grid" style="grid-template-columns:${axisWidth(app.legend)} repeat(${hours.length}, minmax(var(--col-min), 1fr))">
          ${axisMarkup(app)}
          <div class="plot" id="plot" style="grid-column:2 / span ${hours.length};--n:${hours.length}">${plotMarkup(app, hours)}</div>
          <div class="corner"></div>
          ${hours
            .map((h) =>
              h === nowHour
                ? `<div class="slot now" data-hour="${h}">${slotLabel(h)}<small>${escapeHtml(t.now)}</small></div>`
                : `<div class="slot" data-hour="${h}">${slotLabel(h)}</div>`,
            )
            .join("")}
          <div class="acthead"><span>${escapeHtml(t.activity)}</span></div>
          ${hours
            .map((h) => {
              const text = day.hours[h]?.n;
              return `<button class="actcell${h === nowHour ? " now" : ""}" data-hour="${h}" aria-label="${escapeHtml(t.actAria(hourLabel(h), text))}">${actCellContent(text)}</button>`;
            })
            .join("")}
        </div>
      </div>
      <div class="form-foot">
        ${app.isSample ? "<span></span>" : `<span class="saved">✓ ${escapeHtml(t.autosaved)}</span>`}
        <span class="credit">${escapeHtml(t.credit)}</span>
      </div>
    </div>
    <div class="daynote">
      <label for="day-note">${escapeHtml(t.dayNote)}</label>
      <textarea id="day-note" placeholder="${escapeHtml(t.dayNotePh)}">${escapeHtml(day.note)}</textarea>
    </div>`;
  container.dataset.layout = layoutKey(app, hours);

  qs("#prev-day", container).addEventListener("click", () => app.showDay(addDays(app.dayKey, -1)));
  qs("#next-day", container).addEventListener("click", () => app.showDay(addDays(app.dayKey, 1)));
  qs("#go-today", container)?.addEventListener("click", () => app.showDay(app.todayKey()));
  qsa(".actcell", container).forEach((cell) =>
    cell.addEventListener("click", () => openActivitySheet(app, Number(cell.dataset.hour))),
  );
  const note = qs("#day-note", container);
  // saved while typing (not only when leaving the field), so closing the app mid-sentence loses nothing
  const saveNote = debounce(() => {
    if (app.updateNote(note.value)) {
      // the first entry replaced the sample data: keep typing in the new, empty day
      const fresh = qs("#day-note");
      fresh.focus();
      fresh.setSelectionRange(fresh.value.length, fresh.value.length);
    }
  }, 600);
  note.addEventListener("input", saveNote);
  note.addEventListener("blur", () => saveNote.flush());

  const picker = qs("#pick-date", container);
  picker.addEventListener("click", () => picker.showPicker?.());
  picker.addEventListener("change", () => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(picker.value)) app.showDay(picker.value);
  });
  qs("#reminder-backup", container)?.addEventListener("click", () => app.exportBackup());
  qs("#reminder-later", container)?.addEventListener("click", () => app.snoozeBackupReminder());
  bindLegendToggles(app, "day", container);
  bindPlot(app, qs("#plot", container), hours);
  qs(".formscroll", container).scrollLeft = previousScroll;
  scrollToNow(app, container);
}

/** On a phone the form scrolls sideways: open today's form at the current hour (once per day). */
function scrollToNow(app, container) {
  const slot = qs(".slot.now", container);
  if (!slot || app.scrolledToNow === app.dayKey) return;
  app.scrolledToNow = app.dayKey;
  const scroller = qs(".formscroll", container);
  const axis = qs(".axis", container);
  // keep the previous hour visible too, for context
  scroller.scrollLeft = Math.max(0, slot.offsetLeft - axis.offsetWidth - slot.offsetWidth);
}

/** Finger travel (px) that turns a touch into a scroll. */
const TOUCH_SLOP = 10;
/** Press-and-hold time (ms) before a finger draws on the chart. */
const HOLD_MS = 300;

/**
 * Click or drag in the chart to set levels; arrow keys on the focused column.
 * With a finger the chart must not get in the way of scrolling, so:
 * a tap sets one point, a swipe (any direction) scrolls and sets nothing,
 * and press-and-hold, then drag, draws.
 */
function bindPlot(app, plot, hours) {
  let dragging = false;
  let pending = null; // touch/pen gesture whose intent is not known yet: { id, x, y, timer }
  let last = "";

  const redrawPlot = () => {
    plot.innerHTML = plotMarkup(app, hours);
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

  const clearPending = () => {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  };

  const startDrag = (event, capture = true) => {
    clearPending();
    dragging = true;
    last = "";
    // keep receiving moves when the finger leaves the chart (levels clamp to 1–10)
    // and when the redraw removes the element under it
    if (capture) plot.setPointerCapture?.(event.pointerId);
    app.beginUndoableChange();
    applyPointer(event);
  };

  const endDrag = () => {
    clearPending();
    if (!dragging) return;
    dragging = false;
    plot.classList.remove("drawing");
    app.refresh(); // summary and labels, once the gesture is over
    app.offerUndo();
  };

  plot.addEventListener("pointerdown", (event) => {
    if (event.button > 0 || dragging) return;
    if (event.pointerType === "mouse") {
      startDrag(event);
      return;
    }
    clearPending();
    const { pointerId, clientX, clientY } = event;
    const timer = setTimeout(() => {
      // held still: draw from here on (scrolling is blocked by the touchmove handler below)
      startDrag({ pointerId, clientX, clientY });
      plot.classList.add("drawing");
      navigator.vibrate?.(15);
    }, HOLD_MS);
    pending = { id: pointerId, x: clientX, y: clientY, timer };
  });
  plot.addEventListener("pointermove", (event) => {
    if (dragging) {
      applyPointer(event);
    } else if (pending?.id === event.pointerId) {
      // moved before the hold: a scroll, left to the browser
      if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) >= TOUCH_SLOP) clearPending();
    }
  });
  // once drawing, the finger must not scroll the page or the form
  plot.addEventListener("touchmove", (event) => dragging && event.cancelable && event.preventDefault(), {
    passive: false,
  });
  plot.addEventListener("pointerup", (event) => {
    if (pending?.id === event.pointerId) {
      // a tap: set the level where the finger was lifted
      startDrag(event, false);
    }
    endDrag();
  });
  // pointercancel: the browser took over to scroll, so a pending touch sets nothing
  plot.addEventListener("pointercancel", endDrag);
  // only the chart's own capture: a column key losing its implicit touch capture bubbles here too
  plot.addEventListener("lostpointercapture", (event) => event.target === plot && endDrag());

  plot.addEventListener("keydown", (event) => {
    const key = event.target.closest(".colkey");
    if (!key) return;
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
    // the chart was redrawn: put the focus back on the same column
    qs(`#plot .colkey[data-hour="${hour}"]`)?.focus();
  });
}
