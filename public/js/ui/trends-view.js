// "Trends" tab: heatmap, average curve, activity table, and data management.

import { activityStats, filledDays, hourlyAverages, mean } from "../analysis.js";
import { RANGE_OPTIONS } from "../config.js";
import { getDay, slotHours } from "../diary.js";
import { dayRange, hourLabel } from "../dates.js";
import { LEVELS, levelFor } from "../scale.js";
import { escapeHtml, qs, qsa } from "./dom.js";
import { openSettings } from "./settings-sheet.js";
import { bindLegendToggles, horizontalScaleMarkup, legendTogglesMarkup } from "./legend.js";

function heatmapMarkup(app, keys, hours, averages) {
  const { t } = app;
  const cellStyle = (value) => {
    if (value == null) return "";
    const level = levelFor(value);
    return `style="background:${level.color};color:${level.textColor}"`;
  };
  const cellText = (value, decimals) =>
    value == null || !app.legend.numbers ? "" : decimals ? app.formatDecimal(value) : value;

  const rows = [...keys]
    .reverse()
    .map((key) => {
      const day = getDay(app.diary, key);
      const levels = [];
      const cells = hours
        .map((h) => {
          const level = day.hours[h]?.e;
          if (level) levels.push(level);
          return `<td title="${escapeHtml(app.formatShortDate(key))} ${hourLabel(h)}" ${cellStyle(level)}>${cellText(level)}</td>`;
        })
        .join("");
      const average = mean(levels);
      return `<tr><th class="d" scope="row"><button type="button" class="daylink" data-day="${key}">${escapeHtml(app.formatShortDate(key))}</button></th>${cells}<td ${cellStyle(average)}>${cellText(average, true)}</td></tr>`;
    })
    .join("");

  return `<div class="scroll"><table class="heat">
    <thead><tr><th></th>${hours.map((h) => `<th>${h % 24}</th>`).join("")}<th>${escapeHtml(t.avg)}</th></tr></thead>
    <tbody>${rows}
      <tr class="avg"><th class="d">${escapeHtml(t.avg)}</th>${averages
        .map((a) => `<td ${cellStyle(a)}>${cellText(a, true)}</td>`)
        .join("")}<td class="blank"></td></tr>
    </tbody></table></div>`;
}

function curveMarkup(app, hours, averages) {
  const W = 640,
    H = 240,
    L = 34,
    R = 12,
    T = 14,
    B = 30;
  const x = (i) => L + (hours.length < 2 ? 0 : (i * (W - L - R)) / (hours.length - 1));
  const y = (level) => T + ((10 - level) * (H - T - B)) / 9;
  const path = (values) => {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const selected = getDay(app.diary, app.dayKey);
  const selectedLevels = hours.map((h) => selected.hours[h]?.e ?? null);
  const grid = [1, 3, 5, 7, 10]
    .map(
      (e) =>
        `<line x1="${L}" x2="${W - R}" y1="${y(e)}" y2="${y(e)}" stroke="var(--line)"/>${
          app.legend.numbers ? `<text x="${L - 12}" y="${y(e) + 4}" text-anchor="end">${e}</text>` : ""
        }`,
    )
    .join("");
  const ticks = hours
    .map((h, i) => (i % 3 === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${h % 24}</text>` : ""))
    .join("");
  const bar = `<defs><linearGradient id="energy-gradient" x1="0" y1="1" x2="0" y2="0">${LEVELS.map(
    (l, i) => `<stop offset="${i / 9}" style="stop-color:${l.color}"/>`,
  ).join(
    "",
  )}</linearGradient></defs><rect x="${L - 8}" width="8" y="${y(10)}" height="${y(1) - y(10)}" rx="3" style="fill:url(#energy-gradient)"/>`;
  const dots = averages
    .map((a, i) =>
      a == null
        ? ""
        : `<circle cx="${x(i)}" cy="${y(a)}" r="4.5" style="fill:${levelFor(a).color}" stroke="var(--surface)" stroke-width="1.5"/>`,
    )
    .join("");

  return `<div class="scroll"><svg class="curve-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(app.t.chartAria)}">
      ${grid}${bar}${ticks}
      <path d="${path(averages)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>
      ${dots}
      <path d="${path(selectedLevels)}" fill="none" stroke="var(--fg)" stroke-width="1.6" stroke-dasharray="5 4" opacity=".7"/>
    </svg></div>
    <p class="small-print"><span class="key key-avg"></span>${escapeHtml(app.t.periodAvg)} &nbsp; <span class="key key-day"></span>${escapeHtml(app.formatLongDate(app.dayKey))}</p>`;
}

function activitiesMarkup(app, keys) {
  const { t } = app;
  const rows = activityStats(app.diary, keys);
  if (!rows.length) return `<p class="empty-msg">${escapeHtml(t.noActs)}</p>`;
  const trend = (row) => {
    const n = app.legend.numbers;
    if (row.trend === "down")
      return `<span class="down">↓ ${escapeHtml(t.down)}${n ? " " + app.formatDecimal(row.delta) : ""}</span>`;
    if (row.trend === "up")
      return `<span class="up">↑ ${escapeHtml(t.up)}${n ? " +" + app.formatDecimal(row.delta) : ""}</span>`;
    if (row.trend === "stable") return `= ${escapeHtml(t.stable)}`;
    return "–";
  };
  return `<div class="scroll"><table class="acttable">
      <thead><tr><th>${escapeHtml(t.colAct)}</th><th class="n">${escapeHtml(t.colTimes)}</th><th class="n">${escapeHtml(t.colEnergy)}</th><th class="n">${escapeHtml(t.colNext)}</th></tr></thead>
      <tbody>${rows
        .map(
          (row) => `<tr><td>${escapeHtml(row.label)}</td><td class="n">${row.count}</td>
          <td class="n">${
            row.average
              ? `<span class="bar" style="width:${Math.round(row.average * 6)}px;background:${levelFor(row.average).color}"></span>${
                  app.legend.numbers ? app.formatDecimal(row.average) : ""
                }`
              : "–"
          }</td>
          <td class="n">${trend(row)}</td></tr>`,
        )
        .join("")}</tbody>
    </table></div>
    <p class="small-print">${escapeHtml(t.actNote)}</p>`;
}

export function renderTrendsView(app, container) {
  const { t } = app;
  const hours = slotHours(app.diary.settings);
  const keys = dayRange(app.rangeEndKey(), app.range);
  const averages = hourlyAverages(app.diary, keys, hours);

  container.innerHTML = `
    <div class="card">
      <h2>${escapeHtml(t.heatTitle)}</h2>
      <p class="sub">${escapeHtml(t.heatSub(filledDays(app.diary, keys).length, app.range))}</p>
      <div class="seg">${RANGE_OPTIONS.map((n) => `<button data-range="${n}" aria-pressed="${app.range === n}">${escapeHtml(t.nDays(n))}</button>`).join("")}</div>
      ${heatmapMarkup(app, keys, hours, averages)}
      ${horizontalScaleMarkup(app)}
      ${legendTogglesMarkup(app, "trends")}
    </div>
    <div class="card">
      <h2>${escapeHtml(t.curveTitle)}</h2>
      <p class="sub">${escapeHtml(t.curveSub)}</p>
      ${curveMarkup(app, hours, averages)}
    </div>
    <div class="card">
      <h2>${escapeHtml(t.actTitle)}</h2>
      ${activitiesMarkup(app, keys)}
    </div>
    <div class="card">
      <h2>${escapeHtml(t.dataTitle)}</h2>
      <p class="sub">${escapeHtml(t.shareHint)}</p>
      <div class="tools">
        <button class="btn primary" id="export-csv">${escapeHtml(t.expCsv)}</button>
        <button class="btn" id="more-settings">${escapeHtml(t.settings)}…</button>
      </div>
    </div>`;

  qsa("[data-range]", container).forEach((b) =>
    b.addEventListener("click", () => app.setRange(Number(b.dataset.range))),
  );
  qsa("button[data-day]", container).forEach((th) =>
    th.addEventListener("click", () => {
      app.showDay(th.dataset.day, { render: false });
      app.setTab("day");
    }),
  );
  bindLegendToggles(app, "trends", container);
  qs("#export-csv", container).addEventListener("click", () => app.exportCsv());
  qs("#more-settings", container).addEventListener("click", () => openSettings(app));
}
