import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pdfFileName } from "../public/js/files.js";

describe("pdfFileName", () => {
  it("names one day by its date", () => {
    assert.equal(pdfFileName(["2026-09-30"]), "dormouse-diary-2026-09-30");
  });
  it("names several days by the first and last date", () => {
    assert.equal(pdfFileName(["2026-09-24", "2026-09-27", "2026-09-30"]), "dormouse-diary-2026-09-24_2026-09-30");
  });
});
