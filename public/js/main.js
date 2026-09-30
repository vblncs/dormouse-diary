// Entry point: starts the app and registers the service worker for offline use.

import { DiaryApp } from "./app.js";
import { browserStorage } from "./storage.js";

const app = new DiaryApp({
  storage: browserStorage(),
  preferredLanguages: navigator.languages?.length ? navigator.languages : [navigator.language],
});
app.start();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* offline support is optional */
    });
  });
}
