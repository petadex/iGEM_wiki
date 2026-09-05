# Contribution calendar data

Week-by-week team progress for `/contribution/` (April–October 2026).

## Current format

- [`weeks.js`](weeks.js) — generated week skeletons plus mock overrides in `WEEK_CONTENT_OVERRIDES`.
- [`calendarUtils.js`](calendarUtils.js) — month grid helpers and date formatting.
- [`../subteamTracks.js`](../subteamTracks.js) — subteam colors, labels, default links.

## Future CSV import (recommended columns)

One row per week (Sunday `week_start` to Saturday `week_end`):

| Column | Description |
|--------|-------------|
| `week_start` | `YYYY-MM-DD` (Sunday) |
| `week_end` | `YYYY-MM-DD` (Saturday) |
| `overview` | Broad team summary (always shown) |
| `wetLab_summary` | Short line |
| `wetLab_detail` | Optional longer text |
| `wetLab_link` | Optional override URL |
| `dryLab_summary` | … |
| `dryLab_detail` | … |
| … | Repeat for `hardware`, `humanPractices`, `outreach`, `venture`, `web` |

Optional milestone rows (or extra sheet) with:

| Column | Description |
|--------|-------------|
| `week_start` | Links milestone to week |
| `milestone_date` | `YYYY-MM-DD` |
| `milestone_label` | Short label on calendar cell |
| `milestone_subteam` | One of: `wetLab`, `dryLab`, `hardware`, `humanPractices`, `outreach`, `venture`, `web` |

A small Node script can read the CSV at build time and emit `weeks.js`, or you can use `gatsby-transformer-csv` plus a GraphQL query in a page query.

## Adding rich content for a week

Edit `WEEK_CONTENT_OVERRIDES` in `weeks.js` keyed by week id (`week-2026-05-03`, etc.). Week ids are `week-` + Sunday date of that calendar row.
