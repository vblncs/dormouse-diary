// CSV export: one row per filled hour, plus one row per daily note.
// Semicolon-separated with a UTF-8 BOM so Excel (in any European locale) opens it directly.

import { hourLabel } from "./dates.js";

const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** @param {ReturnType<import("./diary.js").createEmptyDiary>} diary @param {object} t translation */
export function diaryToCsv(diary, t) {
  const lines = [t.csvHead.join(";")];
  for (const key of Object.keys(diary.days).sort()) {
    const day = diary.days[key];
    const hours = Object.keys(day.hours)
      .map(Number)
      .sort((a, b) => a - b);
    for (const hour of hours) {
      const entry = day.hours[hour];
      lines.push([key, `${hourLabel(hour)}-${hourLabel(hour + 1)}`, entry.e ?? "", quote(entry.n)].join(";"));
    }
    if (day.note) lines.push([key, t.csvNote, "", quote(day.note)].join(";"));
  }
  return "\ufeff" + lines.join("\r\n");
}
