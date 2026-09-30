# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

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
