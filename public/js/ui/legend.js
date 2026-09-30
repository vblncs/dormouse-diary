// The colour scale as drawn next to the day chart and on the trends tab, plus the legend toggles.

import { escapeHtml, qs } from "./dom.js";
import { LEVELS, LEVEL_STEP, PLOT_PADDING, levelToPercent, scaleGradient } from "../scale.js";

/** Background declaration with an OKLab fallback for older browsers. */
const gradientStyle = (direction) =>
  `background:${scaleGradient(direction)};background:${scaleGradient(`in oklab ${direction}`)}`;

/** Width of the axis column in the day chart, depending on which legends are shown. */
export function axisWidth({ numbers, words }) {
  if (words) return numbers ? "10.4rem" : "9rem";
  return numbers ? "4.6rem" : "2.8rem";
}

/** Vertical axis: "Energy" title, colour bar, optional numbers and word bands. */
export function axisMarkup(app) {
  const { numbers, words } = app.legend;
  const numberMarks = numbers
    ? `<div class="marks-n">${LEVELS.map((l) => `<span style="top:${levelToPercent(l.value)}%">${l.value}</span>`).join(
        "",
      )}</div>`
    : "";
  const wordMarks = words
    ? `<div class="marks-w">${app.t.bands
        .map(([from, to, label]) => {
          const top = levelToPercent(to) - LEVEL_STEP / 2;
          const bottom = levelToPercent(from) + LEVEL_STEP / 2;
          return `<div class="band" style="top:${top}%;height:${bottom - top}%"><span>${escapeHtml(label)}</span></div>`;
        })
        .join("")}</div>`
    : "";
  const inset = PLOT_PADDING - LEVEL_STEP / 2;
  return `<div class="axis">
    <div class="axis-title"><span>${escapeHtml(app.t.axisTitle)}</span></div>
    <div class="axis-bar"><div class="bar-fill" style="top:${inset}%;bottom:${inset}%;${gradientStyle("to top")}"></div></div>
    <div class="axis-marks">${numberMarks}${wordMarks}</div>
  </div>`;
}

/** Horizontal scale for the trends tab; empty when both legends are off. */
export function horizontalScaleMarkup(app) {
  const { numbers, words } = app.legend;
  if (!numbers && !words) return "";
  const digits = numbers ? LEVELS.map((l) => `<span style="color:${l.textColor}">${l.value}</span>`).join("") : "";
  const labels = words
    ? `<div class="words">${app.t.bands
        .map(([from, to, label]) => `<span style="grid-column:${from} / ${to + 1}">${escapeHtml(label)}</span>`)
        .join("")}</div>`
    : "";
  return `<div class="scale-legend"><div class="fade" style="${gradientStyle("to right")}">${digits}</div>${labels}</div>`;
}

export function legendTogglesMarkup(app, prefix) {
  const { numbers, words } = app.legend;
  return `<div class="toggles">
    <label><input type="checkbox" id="${prefix}-numbers" ${numbers ? "checked" : ""}> ${escapeHtml(app.t.legendNums)}</label>
    <label><input type="checkbox" id="${prefix}-words" ${words ? "checked" : ""}> ${escapeHtml(app.t.legendWords)}</label>
  </div>`;
}

export function bindLegendToggles(app, prefix, root) {
  qs(`#${prefix}-numbers`, root).addEventListener("change", (e) => app.setLegend({ numbers: e.target.checked }));
  qs(`#${prefix}-words`, root).addEventListener("change", (e) => app.setLegend({ words: e.target.checked }));
}
