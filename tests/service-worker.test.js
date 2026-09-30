// Guards against the two classic service-worker mistakes: forgetting to cache a new file,
// and forgetting to bump the cache version on release.
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { APP_VERSION } from "../public/js/config.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const publicDir = join(root, "public");
const sw = await readFile(join(publicDir, "sw.js"), "utf8");

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)])),
  );
  return nested.flat();
}

describe("service worker", () => {
  const precache = [...sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  it("precaches every file in public/ (except itself)", async () => {
    const files = (await listFiles(publicDir))
      .map((f) => relative(publicDir, f).split(sep).join("/"))
      .filter((f) => f !== "sw.js" && !f.startsWith("."));
    const missing = files.filter((f) => !precache.includes(f));
    assert.deepEqual(missing, [], `add these to PRECACHE in public/sw.js`);
  });

  it("does not precache files that do not exist", async () => {
    const files = new Set((await listFiles(publicDir)).map((f) => relative(publicDir, f).split(sep).join("/")));
    const extra = precache.filter((f) => f !== "./" && !files.has(f));
    assert.deepEqual(extra, []);
  });

  it("uses the version from package.json", async () => {
    const { version } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
    assert.equal(sw.match(/const VERSION = "([^"]+)"/)[1], version, "bump VERSION in public/sw.js");
    assert.equal(APP_VERSION, version, "bump APP_VERSION in public/js/config.js");
  });

  it("still deletes the caches of the app's former name", () => {
    assert.match(sw, /"energy-profile-diary-"/);
  });
});
