// Energy Profile Diary · SPDX-License-Identifier: AGPL-3.0-or-later
// Service worker: makes the app work offline.
//
// When releasing, bump VERSION (it must match "version" in package.json — checked by the tests).
// Every file under public/ must be listed in PRECACHE (also checked by the tests).

const VERSION = "1.2.0";
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

  const sameOrigin = new URL(request.url).origin === self.location.origin;

  // The app's own files: always network first, so the page and its scripts are updated together
  // (serving cached scripts with a new page could mix two versions). The cache is the offline fallback.
  if (sameOrigin) {
    const cacheKey = request.mode === "navigate" ? "index.html" : request;
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
    return;
  }

  // Fonts from Google: cache first (they never change), then network.
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
