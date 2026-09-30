// The app must not contact any other server: no fonts, scripts or styles from a CDN (privacy),
// and a Content-Security-Policy that would block them anyway.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const read = (path) => readFile(new URL(`../public/${path}`, import.meta.url), "utf8");
const [index, privacy, styles] = await Promise.all([read("index.html"), read("privacy.html"), read("css/styles.css")]);

/** Addresses on another host: http://…, https://… or protocol-relative //… */
const EXTERNAL = /(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}/i;

describe("no external requests", () => {
  it("index.html references no external URL", () => {
    assert.doesNotMatch(index, EXTERNAL);
  });

  it("styles.css references no external URL", () => {
    assert.doesNotMatch(styles, EXTERNAL);
  });

  it("privacy.html loads nothing from elsewhere (it may link to other sites)", () => {
    const loads = [...privacy.matchAll(/<(?:script|link|img|iframe|source)\b[^>]*>/gi)].map((m) => m[0]);
    for (const tag of loads) assert.doesNotMatch(tag, EXTERNAL, tag);
  });

  it("both pages have the same strict Content-Security-Policy", () => {
    const csp = (html) => html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/)?.[1];
    assert.equal(
      csp(index),
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'",
    );
    assert.equal(csp(privacy), csp(index));
  });
});
