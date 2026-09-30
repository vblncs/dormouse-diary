// The 1–10 energy scale: colours, geometry of the chart and descriptive bands.

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

/** Ten colours sampled along one red→green gradient (defined as --e1…--e10 in styles.css). */
export const LEVELS = Object.freeze(
  Array.from({ length: MAX_LEVEL }, (_, i) => {
    const value = i + 1;
    return Object.freeze({
      value,
      color: `var(--e${value})`,
      // dark text on the light middle of the scale, white on the dark ends
      textColor: value <= 3 || value >= 10 ? "#fff" : "#1b1b1b",
    });
  }),
);

export function clampLevel(value) {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, Math.round(value)));
}

/** @param {number} value any number, rounded to the nearest level */
export function levelFor(value) {
  return LEVELS[clampLevel(value) - 1];
}

/** CSS gradient through all ten colours. */
export function scaleGradient(direction) {
  return `linear-gradient(${direction}, ${LEVELS.map((l) => l.color).join(", ")})`;
}

/* ---- chart geometry (percentages of the plot height) ---- */

/** Empty space above level 10 and below level 1. */
export const PLOT_PADDING = 6;
/** Height of one level. */
export const LEVEL_STEP = (100 - 2 * PLOT_PADDING) / (MAX_LEVEL - 1);

/** Vertical position of a level, 0 = top. */
export function levelToPercent(level) {
  return PLOT_PADDING + (MAX_LEVEL - level) * LEVEL_STEP;
}

/** Nearest level for a vertical position (0 = top, 100 = bottom). */
export function percentToLevel(percent) {
  return clampLevel(MAX_LEVEL - (percent - PLOT_PADDING) / LEVEL_STEP);
}

/* ---- descriptive bands ---- */

/**
 * The band a value falls into.
 * @param {number} value
 * @param {ReadonlyArray<[number, number, string]>} bands [from, to, label]
 */
export function bandFor(value, bands) {
  const level = clampLevel(value);
  return bands.find(([from, to]) => level >= from && level <= to) ?? null;
}
