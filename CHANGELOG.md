# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.4.1] – 2026-10-01

### Changed

- New app icon: a sleeping dormouse on a hill-shaped energy curve, coloured by height like the app's scale (red low, green high). It comes in all the sizes browsers and phones ask for: an SVG and PNG favicon, the home-screen icon for iPhone, and regular and maskable icons for installing on Android and computers.

## [1.4.0] – 2026-09-30

The app is now called **Dormouse Diary** (energy diary · diario dell'energia · journal d'énergie · Energietagebuch). Existing diaries, preferences and backup files keep working: the stored data and its storage keys are unchanged.

There was no 1.3.0 release; this entry also covers the changes made since 1.2.0.

### Added

- PDF export: the daily forms, one day per page on A4 landscape, laid out like the paper worksheet, through the print dialog ("Save as PDF"). In Settings → Data choose the day shown or the last 7, 14 or 30 days; on the Trends tab it uses the chosen period. Always printed in light colours; the scale legends are printed as shown on screen.
- Privacy statement in all four languages, linked from the new "About & privacy" section in Settings (with the app version and the credit to H. Lorenzen's method).
- Restoring a backup into a diary that already has entries offers to **add it to the diary** (recommended): missing days and hours are added, nothing already entered is changed, and a summary says what happened. "Replace everything" is still available, with its confirmation.
- Settings → Data says whether the browser has agreed to keep the diary. If it has not and the app is not installed, it explains how to add it to the home screen on iPhone and Android.
- Strict Content-Security-Policy: the page can load only its own files.
- On computer screens the whole day fits without scrolling sideways.
- An app left open follows the clock: the "now" column moves with the hour, and the view moves to the new day at midnight.
- Info button next to the title, showing the app's description on request.

### Changed

- Fonts are served from the app itself instead of Google Fonts, so the app makes no requests to other servers.
- Exported files are named `dormouse-diary-<date>.csv` and `dormouse-diary-backup-<date>.json` in every language.
- On touch screens, swiping on the chart scrolls instead of setting points. Tap to set a point; press and hold, then drag, to draw.
- Tapping the chart or closing the activity panel no longer scrolls the form back to the first hour.
- The legend switches ("Show numbers", "Show descriptions") sit right above the chart.
- The activity panel is simpler: a free text field with a short example, plus buttons for activities used at least twice. The activity dropdown is gone. Entries separated by commas also count as separate activities for these buttons.
- "Remove energy point" is now "Clear this hour's energy level".
- The service worker only deletes this app's own old caches, and caches each page under its own address.

### Removed

- Average, lowest, highest and hours-filled figures under the day form.

## [1.2.0] – 2026-09-30

### Added

- Colour-blind friendly scale (purple → yellow) and a larger text size, in Settings → Display.
- Tap the date to jump to any past day with the system date picker.
- Backup reminder on the Day tab when there has been no backup for 14 days ("Later" hides it for a week). Settings shows the date of the last backup.
- The app asks the browser to keep its storage persistent, so the diary is not cleared automatically when space runs low.

### Changed

- Daily notes and activity text are saved while typing, not only when leaving the field.
- Restoring a backup asks for confirmation before replacing an existing diary.
- "Save backup" is now the main button in the Data section of Settings.
- Dates in the energy map are real buttons, reachable with the keyboard.
- Messages at the bottom of the screen are hidden when a panel opens, so they no longer cover its buttons.

## [1.1.0] – 2026-09-30

### Added

- Settings menu (gear button) with language, diary start and end time, and data tools.
- The current hour is highlighted, and today's form opens scrolled to it on a phone.
- "Undo" after tapping or dragging on the chart.
- Quick-pick buttons with the activities used most often.
- "Saved automatically" note under the form.

### Changed

- Hours after midnight now belong to the previous diary day, so at 00:30 the app opens the day that is still in progress.
- Backup, restore, diary hours and "delete all data" moved from the Trends tab to Settings. Trends keeps the CSV export.
- The language picker moved from the header to Settings.
- The instructions above the chart are shown only while the day is still empty.
- The activity panel saves automatically, like the rest of the app. "Save" and "Save and next hour" are replaced by ‹ › arrows to move between hours and a single "Done" button; closing the panel no longer discards what was typed.

## [1.0.0] – 2026-09-30

### Added

- Daily energy profile in the layout of the paper worksheet (after H. Lorenzen): one column per hour, 08:00–01:00 by default.
- Continuous red-to-green color scale, with optional numeric and descriptive legends.
- Activities per hour: grouped dropdown plus free text, with the person's own activities remembered.
- Daily notes.
- Trends tab: energy heatmap, average curve per hour, activity statistics.
- CSV export, JSON backup and restore.
- Italian, French, German and English, following the device language.
- Offline support and installation as a Progressive Web App.
- Unit tests, ESLint, Prettier, CI and GitHub Pages deployment.
