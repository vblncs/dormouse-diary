// Dormouse Diary · SPDX-License-Identifier: AGPL-3.0-or-later
// Service worker: makes the app work offline.
//
// When releasing, bump VERSION (it must match "version" in package.json — checked by the tests).
// Every file under public/ must be listed in PRECACHE (also checked by the tests).

const VERSION = "1.4.0";
const CACHE = `dormouse-diary-${VERSION}`;
/** Caches this app created, under its current and its former name ("Energy Profile Diary", before 1.4.0). */
const OWN_CACHE_PREFIXES = ["dormouse-diary-", "energy-profile-diary-"];

const PRECACHE = [
  "./",
  "index.html",
  "privacy.html",
  "manifest.webmanifest",
  "css/styles.css",
  "fonts/atkinson-hyperlegible-400-latin.woff2",
  "fonts/atkinson-hyperlegible-400-latin-ext.woff2",
  "fonts/atkinson-hyperlegible-400-italic-latin.woff2",
  "fonts/atkinson-hyperlegible-400-italic-latin-ext.woff2",
  "fonts/atkinson-hyperlegible-700-latin.woff2",
  "fonts/atkinson-hyperlegible-700-latin-ext.woff2",
  "fonts/bricolage-grotesque-latin.woff2",
  "fonts/bricolage-grotesque-latin-ext.woff2",
  "fonts/OFL-AtkinsonHyperlegible.txt",
  "fonts/OFL-BricolageGrotesque.txt",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/main.js",
  "js/privacy.js",
  "js/app.js",
  "js/config.js",
  "js/dates.js",
  "js/scale.js",
  "js/diary.js",
  "js/analysis.js",
  "js/csv.js",
  "js/storage.js",
  "js/files.js",
  "js/reminders.js",
  "js/i18n/index.js",
  "js/i18n/it.js",
  "js/i18n/fr.js",
  "js/i18n/de.js",
  "js/i18n/en.js",
  "js/ui/dom.js",
  "js/ui/legend.js",
  "js/ui/day-view.js",
  "js/ui/activity-sheet.js",
  "js/ui/trends-view.js",
  "js/ui/settings-sheet.js",
  "js/ui/print-view.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // delete older versions of this app's cache only: other apps may share the origin (e.g. on GitHub Pages)
  const isOld = (key) => key !== CACHE && OWN_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter(isOld).map((key) => caches.delete(key)))));
  self.clients.claim();
});

/** Cache key of a page: its address without the query ("privacy.html?lang=fr"), "./" → index.html. */
function pageKey(url) {
  const key = new URL(url);
  key.search = "";
  key.hash = "";
  if (key.pathname.endsWith("/")) key.pathname += "index.html";
  return key.href;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // only this app's own files; the page makes no other requests (see the Content-Security-Policy)
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Always network first, so the page and its scripts are updated together
  // (serving cached scripts with a new page could mix two versions). The cache is the offline fallback.
  const cacheKey = request.mode === "navigate" ? pageKey(request.url) : request;
  event.respondWith(
    fetch(request, { cache: "no-cache" })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(cacheKey, copy));
        }
        return response;
      })
      .catch(() => caches.match(cacheKey).then((cached) => cached ?? Response.error())),
  );
});
