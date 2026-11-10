# Beam Advanced Search (front-end clone)

A working front-end clone of a UK company-intelligence "Advanced Search" page. It includes the query builder, results table, statistics dashboard and guided tour. It runs entirely in the browser on 5,000 seeded, fictional companies. There is no backend.

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm run test    # Vitest: data calibration, query engine, stats, profile maths (31 tests)
npm run e2e     # Playwright: both tour walk-throughs + feature checks (13 tests), shots in ./e2e-shots/
npm run build
```

The first visit auto-starts the "Build your first search" tour. To see it again, clear `nb.tourSeen` in localStorage, or use **? Tour** or **Platform tours**.

## Where things live

| Area | Path |
|---|---|
| Brand, seed, sizes | `src/config.ts` (`BRAND_NAME`) |
| Design tokens | `tailwind.config.ts` |
| Dummy data (seeded) | `src/data/generate.ts`, `src/data/taxonomies/*` |
| Criteria registry (config-only criteria) | `src/criteria/registry.ts` |
| Query engine / sort / paging | `src/query/run.ts`, `src/query/sort.ts` |
| Stats engine (pure, unit tested) | `src/stats/compute.ts` |
| Tour steps (data-driven) | `src/components/tour/steps.ts` |
| Tour engine (beacons, recovery) | `src/components/tour/TourEngine.tsx` |
| Event bus the tour listens to | `src/lib/eventBus.ts` |

To add a criterion, add one definition in `registry.ts` and one entry in `PICKER_TREE`. The builder renders rows from the registry, so no other code changes.

To add a tour step, add an entry in `steps.ts`. It needs a `data-tour` key as its target and, for action steps, the bus event that advances it. If the target disappears because the user went off-script, the step waits. Its `recover` hint then points the user back.

## Calibration

The tour's demo query (Industries = AI, CH status = Active, Signals = Equity fundraising OR 20% scaleup) returns **1,907** of the 5,000 companies. A Vitest test (`tests/data.test.ts`) asserts the count stays between 1,850 and 1,980. The "view all 13,996,566 companies" headline is cosmetic; the link runs an empty query over the 5,000 rows.

## Company profile (part 2)

You can open a profile in any of these ways:
- the navbar's **Company profile ›** menu (the Lumen Bank demo plus recently viewed companies)
- the **Profile** button beside each search result
- any company name in results, statistics, news or similar companies
- the global search box

The URL is `/companies/:id/:section?`, and the browser's back and forward buttons move between sections.

| Area | Path |
|---|---|
| Page layout, sticky header, left nav | `src/pages/company/CompanyPage.tsx`, `CompanyHeader.tsx` |
| One component per section | `src/pages/company/sections/*.tsx` |
| Shared profile UI (cards, chips, pager, tooltips, toast) | `src/pages/company/ui.tsx`, `shared.tsx`, `MultiSelect.tsx` |
| Profile generator (deterministic, derived from the search record) | `src/data/profile/generateProfile.ts` |
| Financial statements (subtotals computed so they reconcile) | `src/data/profile/financials.ts` |
| Shareholdings, similarity (TF-IDF + industry overlap) | `src/data/profile/ownership.ts`, `similarity.ts` |
| Hand-built demo fixtures: Lumen Bank, Harrowmere Group (deep corporate tree) | `src/data/fixtures/lumen-bank.ts` |
| Tour 2 steps | `src/components/tour/steps.ts` (`PROFILE`) |

All names (companies, people, investors, emails, news sources, addresses) are fictional. Unit tests in `tests/profile.test.ts` check that:
- Lumen Bank's figures land in the spec's ballpark (16 rounds ≈ £1.42b, 193,153,514 shares ≈ £3.28b, 40 filings, 378 news)
- financial statements reconcile every year
- ownership percentages add to 100%

## Visual-gap report

No reference screenshots were provided (`./reference/` does not exist), so every screen was checked against the written spec and its tokens only. Pixel comparison has not been done. Known gaps and judgement calls:

- **Not pixel-verified.** Spacing, font sizes and colours follow the spec's tokens (Public Sans 15px, `#4B4291`, 1040/1170px widths, 52px logos, 83px rows). Exact offsets may drift from the original. When `./reference/` is added, run `node e2e/shot.mjs <name> e2e/flows/<flow>.mjs` (flows exist for builder, results, stats, downloads) and compare.
- **Foundations chart**: cessations are drawn as orange negative bars beneath the green foundations bars. The spec only described the green bars.
- **Settings (⚙) buttons** toggle data labels on the foundations chart and point markers on the age chart. Their real behaviour wasn't specified.
- **HTML-rendered cards** (tracking, KPIs, rankings, ESG, top 10s) export PNG/SVG as an equivalent ECharts bar chart. CSV is exact.
- **Emoji flags** are inline SVGs, because Windows doesn't render flag emoji.
- **Profile screenshots**: `./reference-profile/` was not provided either, so the profile follows the part 2 spec's tokens and descriptions only. `node e2e/profile-shots.mjs [companyId]` captures every section into `e2e-shots/profile/` for comparison.
- **Platform tours** has three tours (search, company profile, results table), so the badge reads "2/3" after the profile tour rather than the recording's "2/2".
- **Quick view**: the part 1 side drawer is kept as a "quick view" (eye button on result rows, activity feed, map popups) with an "Open full profile" button.
- **Corporate tree** labels open the linked company in a new tab only when that company has a profile. Generated subsidiaries don't.
- **Filing PDFs** are placeholder documents generated with jsPDF.
- **Map tiles** come from OpenStreetMap and need network access.
- **Bundle**: ECharts and Leaflet are lazy-loaded with their tabs. The main chunk (~770 kB, mostly the faker locale) still triggers Vite's 500 kB warning.
# beauhurst-clone-bis
