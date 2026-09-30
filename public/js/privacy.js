// Privacy page: shows the statement in the reader's language
// (?lang= in the address, then the language chosen in the app, then the device language).

import { pickLanguage } from "./i18n/index.js";
import { browserStorage, loadLanguage, loadPrefs } from "./storage.js";

const storage = browserStorage();
const lang = pickLanguage({
  requested: new URLSearchParams(location.search).get("lang"),
  saved: loadLanguage(storage),
  preferred: navigator.languages?.length ? navigator.languages : [navigator.language],
});

const root = document.documentElement;
root.lang = lang;
// same text size as in the app
root.dataset.textSize = loadPrefs(storage).textSize;

for (const article of document.querySelectorAll("article[lang]")) {
  article.hidden = article.lang !== lang;
  if (!article.hidden) document.title = article.dataset.title;
}
for (const link of document.querySelectorAll(".langs a")) {
  if (link.lang === lang) link.setAttribute("aria-current", "true");
}
