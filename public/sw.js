// Energy Profile Diary · SPDX-License-Identifier: AGPL-3.0-or-later
// Service worker: makes the app work offline.
//
// When releasing, bump VERSION (it must match "version" in package.json — checked by the tests).
// Every file under public/ must be listed in PRECACHE (also checked by the tests).

const VERSION = "1.0.0";
const CACHE = `energy-profile-diary-${VERSION}`;

const PRECACHE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/main.js",
  "js/app.js",
  "js/config.js",
  "js/dates.js",
  "js/scale.js",
  "js/diary.js",
  "js/analysis.js",
  "js/csv.js",
  "js/storage.js",
  "js/files.js",
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
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Pages: network first so updates arrive, cache when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html")),
    );
    return;
  }

  // Everything else (scripts, styles, icons, fonts): cache first, then network.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok || response.type === "opaque") {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
