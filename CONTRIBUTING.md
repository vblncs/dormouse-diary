# Contributing

Thanks for helping improve Energy Profile Diary.

## Setup

```bash
npm install
npm start        # http://localhost:8000
```

## Before opening a pull request

```bash
npm run format   # fix formatting
npm run check    # lint + formatting + tests (the same checks CI runs)
```

## Guidelines

- **Keep it dependency-free at runtime.** The app ships exactly what is in `public/`, with no build step.
- **Put logic in the pure modules** (`diary.js`, `analysis.js`, `csv.js`, `dates.js`, `scale.js`) and cover it with a test in `tests/`. UI modules should only render and call `DiaryApp`.
- **Translate every new string** in all four files under `public/js/i18n/`. The i18n test fails if a key is missing.
- **New files in `public/`** must be added to `PRECACHE` in `public/sw.js`, or offline use breaks. A test checks this.
- **Never change the stored data format without an upgrade path** in `normalizeDiary`. People's existing diaries must keep loading.
- **Accessibility:** controls need visible focus, labels, and keyboard access.
- **Privacy:** no analytics, trackers or network calls with personal data.

## Commit messages

Use short, imperative subjects, for example `Add Spanish translation` or `Fix heatmap average for empty days`.

## License

By contributing, you agree that your contributions are licensed under the AGPL-3.0-or-later, like the rest of the project.
