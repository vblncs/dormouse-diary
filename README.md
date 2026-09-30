# Dormouse Diary

_energy diary · diario dell'energia · journal d'énergie · Energietagebuch_

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

Dormouse Diary is a simple, installable web app for keeping an hour-by-hour **energy profile**: how much energy a person has through the day, and what they were doing at the time. It is meant to help people living with fatigue, and the professionals supporting them, see patterns such as when energy dips and which activities drain or restore it.

The layout follows the paper _energy profile_ worksheet used in fatigue management (after H. Lorenzen, 2010). Energy is recorded on a **color scale** instead of numbers from 1 to 10, which many people find easier to fill in.

No account, no server, no tracking. All data stays on the device. See the [privacy statement](public/privacy.html).

---

## Features

- **Paper-like daily form.** One column per hour, from 08:00 to 01:00 by default. Tap the height that matches your energy level, and the points are joined into a curve. With a mouse, click or drag; on a touch screen, tap, or press and hold and then drag to draw. Swipes scroll the page as usual.
- **Current hour highlighted.** On a phone, today's form opens scrolled to the hour you are in. On a computer screen the whole day fits without scrolling.
- **Undo** after tapping or dragging on the chart, in case of a mis-tap.
- **Continuous color scale** from red (no energy) to green (full energy), shown beside the chart. A **colour-blind friendly** scale (purple → yellow) and **larger text** are available in Settings.
- **Optional legends**, switched on above the chart. Both are hidden by default:
  - _numbers_ show levels 1–10;
  - _descriptions_ show five words, each covering two levels. In English these are: exhausted (1–2), tired (3–4), okay (5–6), good (7–8), full of energy (9–10).
- **Activities per hour**, typed freely. Buttons offer the activities used most often (at least twice, at most six). Several activities can be combined in one hour, for example `Breakfast + Cat` or `Breakfast, cat`.
- **Daily notes** for sleep, symptoms or anything unusual. Notes and activities are saved while typing.
- **Go to any day**: arrows for the previous and next day, or tap the date to pick one. An app left open follows the clock into the next hour and day.
- **Trends tab**
  - Energy map: a heatmap of days × hours over 7, 14 or 30 days.
  - Average energy per hour, compared with the selected day.
  - Activities and energy: how often each activity appears, the average energy during it, and whether energy tends to drop or rise in the hour after.
- **Export and backup**
  - PDF export of the daily forms, one day per page, laid out like the paper worksheet. It uses the print dialog ("Save as PDF"), so no PDF library is needed. Choose the day shown or the last 7, 14 or 30 days in Settings, or use the period chosen on the Trends tab. Days without entries are left out.
  - CSV export, semicolon-separated so it opens directly in Excel.
  - JSON backup. Restoring a backup into a diary that already has entries offers to **add it to the diary** (nothing already entered is changed) or to replace everything.
- **Settings menu** (gear button): language, display, when the day starts and ends (including past midnight), data tools, whether the browser keeps the diary safe, and an "About & privacy" section. Hours after midnight belong to the previous diary day.
- **Four languages**: Italiano, Français, Deutsch, English. The app follows the device language on first launch, falls back to English for any other language, and remembers the choice made in Settings.
- **Works offline and installs** to the home screen as a Progressive Web App.
- **Light and dark mode** follow the system setting.
- **Keyboard accessible**: on the chart, the up and down arrows change the level, Delete clears it, and Enter opens the activity panel.

On first launch the app shows a week of clearly marked **sample data**. Tapping **Start my diary** clears it.

---

## Privacy

The full [privacy statement](public/privacy.html) is part of the app, in all four languages (Settings → About & privacy).

- Everything is stored in the browser's `localStorage` on the device. Nothing is sent to any server, and there are no analytics, cookies or third parties.
- **The app makes no external requests.** Fonts are served from the app itself (`public/fonts/`), and a strict Content-Security-Policy only lets the page load its own files. A test fails if `index.html` or `styles.css` refers to another site.
- The hosting service (GitHub Pages) keeps standard access logs, for example IP addresses, like any web server.
- Because the data lives in one browser on one device:
  - clearing browser data or using a private window will lose it;
  - on iPhone, the home-screen app and Safari keep **separate** storage, so always open the app from the same place;
  - use **Save backup** in Settings regularly, and **Restore backup** to move the diary to another device. The app reminds you when the last backup is more than 14 days old.
- The app asks the browser to keep its storage persistent, which protects the diary from being cleared automatically when the device runs low on space. Settings → Data shows whether the browser agreed; if not, and the app is not installed, it explains how to add it to the home screen.

---

## Getting started

Requirements: [Node.js](https://nodejs.org/) 20 or later (only for development; the app itself has no dependencies and no build step).

```bash
npm install     # installs the dev tools (ESLint, Prettier)
npm start       # serves public/ at http://localhost:8000
```

The app uses ES modules, so it must be served over HTTP; opening `public/index.html` directly from disk will not work.

### Scripts

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm start`            | Local server for `public/` (`PORT=3000` to change the port) |
| `npm test`             | Unit tests with the built-in Node test runner               |
| `npm run lint`         | ESLint                                                      |
| `npm run format`       | Formats all files with Prettier                             |
| `npm run format:check` | Checks formatting without changing files                    |
| `npm run check`        | Lint + formatting + tests, as CI runs them                  |

---

## Deployment

The **Deploy to GitHub Pages** workflow publishes the `public/` folder whenever `main` changes and the checks pass.

One-time setup:

1. Go to **Settings → Pages → Build and deployment**.
2. Set **Source** to **GitHub Actions**.

The app will be available at `https://<user>.github.io/<repo>/`. On a free GitHub plan, Pages requires the repository to be public.

Any other static host works too, for example Netlify or Cloudflare Pages: publish the `public/` folder as it is. All paths are relative, so the app can live in a sub-folder. If you host it elsewhere, update the "Hosting" paragraph of `public/privacy.html`.

### Installing on a phone

- **iPhone / iPad (Safari):** Share → _Add to Home Screen_. The installed app starts with its own, empty storage: save a backup in Safari first, then restore it in the installed app.
- **Android (Chrome):** menu ⋮ → _Install app_ or _Add to Home screen_

---

## Project structure

```
public/                      Everything that gets deployed
├── index.html               Page shell (with the Content-Security-Policy)
├── privacy.html             Privacy statement, in all four languages
├── manifest.webmanifest     PWA metadata
├── sw.js                    Service worker (offline cache)
├── css/styles.css           All styles, fonts, color tokens, light/dark themes
├── fonts/                   Atkinson Hyperlegible and Bricolage Grotesque (woff2, SIL OFL)
├── icons/                   App icons
└── js/
    ├── main.js              Entry point: starts the app, registers the service worker
    ├── privacy.js           Privacy page: picks the language
    ├── app.js               DiaryApp controller: state, editing, saving, import/export
    ├── config.js            Constants (version, storage keys, default hours, …)
    ├── diary.js             Data model: validate/upgrade, edit, merge, sample data (pure)
    ├── analysis.js          Averages, activity statistics                       (pure)
    ├── csv.js               CSV export                                          (pure)
    ├── dates.js             Date keys, hour labels, locale formatting           (pure)
    ├── scale.js             Energy levels, colors, chart geometry, bands        (pure)
    ├── reminders.js         When to remind about backups                        (pure)
    ├── storage.js           localStorage access, persistent-storage status
    ├── files.js             File download and upload
    ├── i18n/                One file per language + language detection
    └── ui/                  Rendering: day view, activity sheet, settings, trends view, legend, print (PDF)
tests/                       Unit tests (node:test), no browser needed
scripts/serve.mjs            Zero-dependency development server
.github/                     CI, Pages deployment, Dependabot
```

**Design principles**

- Modules marked _pure_ have no DOM or storage access. Every calculation lives there and is unit-tested.
- The UI modules only render and forward user actions to `DiaryApp`, which is the single place that changes and saves state.
- There are no runtime dependencies, no build step and no network requests at runtime. What is in `public/` is exactly what runs in the browser.

---

## Making changes

- **Translations** live in `public/js/i18n/<code>.js`. All languages must have the same keys; `tests/i18n.test.js` fails otherwise. Each file contains:
  - the interface text;
  - the descriptive legend (`bands`);
  - the sample data (`demoPlan`).

  The privacy statement is translated directly in `public/privacy.html`.

- **Adding a language:** copy `en.js`, translate it, then register it in `i18n/index.js` (`TRANSLATIONS` and `LANGUAGE_NAMES`) and in `PRECACHE` in `sw.js`, and add a section to `privacy.html`.
- **Adding a file under `public/`:** also add it to `PRECACHE` in `public/sw.js`. A test checks this.
- **External resources are blocked** by the Content-Security-Policy in `index.html` and `privacy.html`. Serve everything from `public/` instead.
- **Storage keys** (`profiloEnergetico.*` in `config.js`) keep the app's first name on purpose: changing them would make existing diaries disappear. A test checks this.
- **Default hours** for new diaries: change `DEFAULT_SETTINGS` in `config.js` (`start: 8, end: 24`). `end` is the start hour of the last slot, so `24` means 00:00–01:00.
- **Colors:** the ten scale colors are the `--e1` … `--e10` CSS variables in `styles.css`. They are sampled along one gradient so that the scale blends smoothly.

### Releasing

1. Update `version` in `package.json`.
2. Set the same value for `VERSION` in `public/sw.js` and `APP_VERSION` in `public/js/config.js`. A test checks that they match. Changing it makes installed copies download the new files.
3. Add an entry to `CHANGELOG.md`.
4. Merge to `main`. The deploy workflow publishes it.

---

## Data format

Backups are the stored diary as JSON, saved as `dormouse-diary-backup-<date>.json` (CSV exports: `dormouse-diary-<date>.csv`; the print dialog suggests `dormouse-diary-<first date>_<last date>` for a PDF):

```json
{
  "v": 2,
  "settings": { "start": 8, "end": 24 },
  "days": {
    "2026-09-30": {
      "note": "Slept badly",
      "hours": {
        "8": { "e": 6, "n": "Breakfast + Cat" },
        "9": { "e": 7, "n": "Reading" },
        "24": { "e": 2, "n": "Sleeping" }
      }
    }
  }
}
```

In this structure:

- `hours` keys are the slot's start hour, and values of 24 or more belong to the same diary day after midnight;
- `e` is the energy level from 1 to 10;
- `n` is the activity text.

Older backups, including those from the first version, are upgraded automatically when restored (`normalizeDiary` in `diary.js`). Adding a backup to an existing diary is done by `mergeDiaries` in `diary.js`.

The CSV export has one row per filled hour, with the columns date, time slot, energy (1–10) and activity. Daily notes appear as extra rows.

---

## Background

The daily energy profile is a tool from occupational-therapy approaches to fatigue management. It is described in Heiko Lorenzen's _Fatigue Management: Umgang mit chronischer Müdigkeit und Erschöpfung_ (Schulz-Kirchner Verlag). Recording energy and activities over several typical days helps with **pacing**: spreading demanding activities out, planning rest before energy runs out, and recognising what helps recovery.

## Disclaimer

This app is a self-observation aid. It is not a medical device and does not give medical advice. Discuss the results with a qualified health professional.

## Contact

dormouse.diary@proton.me

## License

Copyright (C) 2026 vblncs

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [LICENSE](LICENSE) file for the full text.

In short, anyone may use, study, share and modify this app. If they distribute a modified version, or run one for others over a network, they must make their source code available under the same license.

The fonts in `public/fonts/` are licensed separately under the SIL Open Font License 1.1 (see the `OFL-*.txt` files next to them).
