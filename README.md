# Energy Profile Diary

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)

A simple, installable web app for keeping an hour-by-hour **energy profile**: how much energy a person has through the day, and what they were doing at the time. It is meant to help people living with fatigue, and the professionals supporting them, see patterns such as when energy dips and which activities drain or restore it.

The layout follows the paper _energy profile_ worksheet used in fatigue management (after H. Lorenzen, 2010). Energy is recorded on a **color scale** instead of numbers from 1 to 10, which many people find easier to fill in.

No account, no server, no tracking. All data stays on the device.

---

## Features

- **Paper-like daily form.** One column per hour, from 08:00 to 01:00 by default. Tap the height that matches your energy level, and the points are joined into a curve.
- **Current hour highlighted.** On a phone, today's form opens scrolled to the hour you are in.
- **Undo** after tapping or dragging on the chart, in case of a mis-tap.
- **Continuous color scale** from red (no energy) to green (full energy), shown beside the chart. A **colour-blind friendly** scale (purple → yellow) and **larger text** are available in Settings.
- **Optional legends.** Both are hidden by default:
  - a _numeric legend_ shows levels 1–10;
  - a _descriptive legend_ shows five words, each covering two levels. In English these are: exhausted (1–2), tired (3–4), okay (5–6), good (7–8), full of energy (9–10).
- **Activities per hour.** Tap one of your most frequent activities, pick from a grouped dropdown, or type freely. Several activities can be combined, for example `Breakfast + Caring for pets`. Activities you type yourself are offered in the dropdown next time.
- **Daily notes** for sleep, symptoms or anything unusual. Notes and activities are saved while typing.
- **Go to any day**: arrows for the previous and next day, or tap the date to pick one.
- **Trends tab**
  - Energy map: a heatmap of days × hours over 7, 14 or 30 days.
  - Average energy per hour, compared with the selected day.
  - Activities and energy: how often each activity appears, the average energy during it, and whether energy tends to drop or rise in the hour after.
- **Export and backup**
  - CSV export, semicolon-separated so it opens directly in Excel.
  - JSON backup and restore.
- **Settings menu** (gear button): language, when the day starts and ends (including past midnight), export, backup, restore and delete. Hours after midnight belong to the previous diary day.
- **Four languages**: Italiano, Français, Deutsch, English. The app follows the device language on first launch, falls back to English for any other language, and remembers the choice made in Settings.
- **Works offline and installs** to the home screen as a Progressive Web App.
- **Light and dark mode** follow the system setting.
- **Keyboard accessible**: on the chart, the up and down arrows change the level, Delete clears it, and Enter opens the activity panel.

On first launch the app shows a week of clearly marked **sample data**. Tapping **Start my diary** clears it.

---

## Privacy

- Everything is stored in the browser's `localStorage` on the device.
- Nothing is sent to any server, and there are no analytics or cookies.
- Because the data lives in one browser on one device:
  - clearing browser data or using a private window will lose it;
  - on iPhone, the home-screen app and Safari keep **separate** storage, so always open the app from the same place;
  - use **Save backup** in Settings regularly, and **Restore backup** to move the diary to another device. The app reminds you when the last backup is more than 14 days old.
- The app asks the browser to keep its storage persistent, which protects the diary from being cleared automatically when the device runs low on space.

The only external requests are for the Google Fonts stylesheet and font files. If the fonts cannot load, the app falls back to system fonts.

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

Any other static host works too, for example Netlify or Cloudflare Pages: publish the `public/` folder as it is. All paths are relative, so the app can live in a sub-folder.

### Installing on a phone

- **iPhone / iPad (Safari):** Share → _Add to Home Screen_
- **Android (Chrome):** menu ⋮ → _Install app_ or _Add to Home screen_

---

## Project structure

```
public/                      Everything that gets deployed
├── index.html               Page shell
├── manifest.webmanifest     PWA metadata
├── sw.js                    Service worker (offline cache)
├── css/styles.css           All styles, color tokens, light/dark themes
├── icons/                   App icons
└── js/
    ├── main.js              Entry point: starts the app, registers the service worker
    ├── app.js               DiaryApp controller: state, editing, saving, import/export
    ├── config.js            Constants (storage keys, default hours, …)
    ├── diary.js             Data model: validate/upgrade, edit, sample data   (pure)
    ├── analysis.js          Averages, day summary, activity statistics        (pure)
    ├── csv.js               CSV export                                         (pure)
    ├── dates.js             Date keys, hour labels, locale formatting          (pure)
    ├── scale.js             Energy levels, colors, chart geometry, bands       (pure)
    ├── storage.js           localStorage access (storage injected for tests)
    ├── files.js             File download and upload
    ├── i18n/                One file per language + language detection
    └── ui/                  Rendering: day view, activity sheet, settings, trends view, legend
tests/                       Unit tests (node:test), no browser needed
scripts/serve.mjs            Zero-dependency development server
.github/                     CI, Pages deployment, Dependabot
```

**Design principles**

- Modules marked _pure_ have no DOM or storage access. Every calculation lives there and is unit-tested.
- The UI modules only render and forward user actions to `DiaryApp`, which is the single place that changes and saves state.
- There are no runtime dependencies and no build step. What is in `public/` is exactly what runs in the browser.

---

## Making changes

- **Translations** live in `public/js/i18n/<code>.js`. All languages must have the same keys; `tests/i18n.test.js` fails otherwise. Each file contains:
  - the interface text;
  - the descriptive legend (`bands`);
  - the activity list (`acts`);
  - the sample data (`demoPlan`).
- **Adding a language:** copy `en.js`, translate it, then register it in `i18n/index.js` (`TRANSLATIONS` and `LANGUAGE_NAMES`) and in `PRECACHE` in `sw.js`.
- **Adding a file under `public/`:** also add it to `PRECACHE` in `public/sw.js`. A test checks this.
- **Default hours** for new diaries: change `DEFAULT_SETTINGS` in `config.js` (`start: 8, end: 24`). `end` is the start hour of the last slot, so `24` means 00:00–01:00.
- **Colors:** the ten scale colors are the `--e1` … `--e10` CSS variables in `styles.css`. They are sampled along one gradient so that the scale blends smoothly.

### Releasing

1. Update `version` in `package.json`.
2. Set the same value for `VERSION` in `public/sw.js`. A test checks that they match. Changing it makes installed copies download the new files.
3. Add an entry to `CHANGELOG.md`.
4. Merge to `main`. The deploy workflow publishes it.

---

## Data format

Backups are the stored diary as JSON:

```json
{
  "v": 2,
  "settings": { "start": 8, "end": 24 },
  "days": {
    "2026-09-30": {
      "note": "Slept badly",
      "hours": {
        "8": { "e": 6, "n": "Breakfast + Caring for pets" },
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

Older backups, including those from the first version, are upgraded automatically when restored (`normalizeDiary` in `diary.js`).

The CSV export has one row per filled hour, with the columns date, time slot, energy (1–10) and activity. Daily notes appear as extra rows.

---

## Background

The daily energy profile is a tool from occupational-therapy approaches to fatigue management. It is described in Heiko Lorenzen's _Fatigue Management: Umgang mit chronischer Müdigkeit und Erschöpfung_ (Schulz-Kirchner Verlag). Recording energy and activities over several typical days helps with **pacing**: spreading demanding activities out, planning rest before energy runs out, and recognising what helps recovery.

## Disclaimer

This app is a self-observation aid. It is not a medical device and does not give medical advice. Discuss the results with a qualified health professional.

## License

Copyright (C) 2026 Virginie

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU Affero General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [LICENSE](LICENSE) file for the full text.

In short, anyone may use, study, share and modify this app. If they distribute a modified version, or run one for others over a network, they must make their source code available under the same license.
