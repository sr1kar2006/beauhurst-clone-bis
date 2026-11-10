# Northbeam: Company Intelligence Platform Clone

A front-end clone of a UK company-intelligence platform. It runs entirely in the browser on generated dummy data, with no backend.

It has two modes:

1. **Advanced Search**: build a query from filters, then explore the matching companies in a results table, a statistics dashboard, an activity feed, news and a map.
2. **Company Profile**: a full page for one company, split into 15 sections and navigated from a left-hand menu.

A data-driven guided-tour engine covers both modes.

"Northbeam" is a placeholder brand. Every company, person, investor, email address, address and news headline in the data is **fictional**.

---

## Contents

1. [Quick start](#1-quick-start)
2. [Tech stack](#2-tech-stack)
3. [Project structure](#3-project-structure)
4. [Routing and app shell](#4-routing-and-app-shell)
5. [Data layer](#5-data-layer)
6. [Mode 1: Advanced Search](#6-mode-1-advanced-search)
7. [Mode 2: Company Profile](#7-mode-2-company-profile)
8. [Guided tours](#8-guided-tours)
9. [State management](#9-state-management)
10. [Design system](#10-design-system)
11. [Testing](#11-testing)
12. [How to extend](#12-how-to-extend)
13. [Known gaps and decisions](#13-known-gaps-and-decisions)

---

## 1. Quick start

Requirements: Node 18+ (built and tested on Node 24, npm 12).

```bash
npm install
npx playwright install chromium   # only needed for e2e tests

npm run dev     # http://localhost:5173
npm run test    # Vitest unit tests (31)
npm run e2e     # Playwright end-to-end tests (13); screenshots go to ./e2e-shots/
npm run build   # type-check + production build into ./dist
```

On a first visit, the "Build your first search" tour starts automatically. To see it again, clear `nb.tourSeen` from localStorage, or start it from **? Tour** or the yellow **Platform tours** button.

**Useful URLs**

| URL | What it shows |
|---|---|
| `/` | Advanced Search |
| `/?q=<base64>` | Advanced Search with a shared query restored and run |
| `/companies/lumen-bank` | Profile of the hand-built demo company |
| `/companies/lumen-bank/ownership` | Deep link to one profile section |
| `/companies/harrowmere-group/corporate-structure` | Demo company with a deeper corporate tree |
| `/companies/c17` | Any generated company (`c1` … `c5000`) |

---

## 2. Tech stack

| Concern | Library |
|---|---|
| Build / dev server | Vite 5 |
| UI | React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3 (design tokens in `tailwind.config.ts`) |
| Routing | react-router-dom 6 |
| State | Zustand 4 |
| Charts | Apache ECharts 5 via `echarts-for-react` |
| Map | Leaflet + react-leaflet + leaflet.markercluster |
| Popover positioning | @floating-ui/react |
| Icons | lucide-react |
| Dummy data | @faker-js/faker (fixed seed) + a custom seeded RNG |
| Corporate tree layout | d3-hierarchy |
| Placeholder filing PDFs | jsPDF (lazy-loaded) |
| Unit tests | Vitest |
| End-to-end and visual checks | Playwright |

Fonts (Google Fonts): **Public Sans** (UI), **Open Sans** (tour tooltips), **Libre Caslon Text** (wordmark).

Persistence is browser `localStorage` only, with every access wrapped in try/catch. It stores:

- saved searches
- collections
- table column choices
- tour progress
- recently viewed profiles

---

## 3. Project structure

```
bea/
├── index.html                  Fonts + root element
├── package.json                Scripts: dev, build, test, e2e
├── vite.config.ts              Vite + Vitest config
├── tailwind.config.ts          Design tokens (colours, radii, fonts, animations)
├── playwright.config.ts        1844×1032 viewport, auto-starts the dev server
├── README.md                   Short readme + visual-gap report
├── PROJECT.md                  This document
│
├── src/
│   ├── main.tsx / App.tsx      Entry point; router, global chrome, modals, tour engine
│   ├── config.ts               BRAND_NAME, data seed, dataset size, headline counts
│   ├── index.css / print.css   Base styles, scrollbars, print stylesheet for profile PDF
│   │
│   ├── pages/
│   │   ├── search/SearchPage.tsx       Advanced Search page
│   │   └── company/                    Company Profile page
│   │       ├── CompanyPage.tsx         Layout, section routing, left nav, print mode
│   │       ├── CompanyHeader.tsx       Sticky company bar + Collections/PDF/CSV/Share/Report
│   │       ├── sections.ts             Ordered section list + enabled/disabled rules
│   │       ├── sections/*.tsx          One component per section (15)
│   │       ├── shared.tsx              Signals, mini timeline, valuation chart, financial summary, key people
│   │       ├── ui.tsx                  Card, KeyValueTable, chips, badges, Sparkline, Pager, Tip, Toasts…
│   │       └── MultiSelect.tsx         "N selected ▾" filter popover + infinite-scroll hook
│   │
│   ├── components/
│   │   ├── chrome/      Header (with "Company profile" menu), breadcrumb, page actions,
│   │   │                footer, floating help, global search, save/open/help modals
│   │   ├── builder/     Query builder: sentence header, criterion rows, criteria picker,
│   │   │                industries modal, list popover, tree popover
│   │   ├── empty/       Pre-search empty state + Germany promo
│   │   ├── results/     Tabs, results table, pagination, column editor, collection modal,
│   │   │                quick-view drawer
│   │   ├── stats/       Statistics dashboard + chart cards (Companies / Fundraisings / MBOs)
│   │   ├── feeds/       Recent Activity, Company News, Map
│   │   ├── tour/        Tour engine, step definitions, Book-a-demo modal
│   │   └── ui/          Primitives: Button, Popover, Modal, Checkbox (tri-state), CompactSelect
│   │
│   ├── data/
│   │   ├── generate.ts             Seeded generator: 5,000 UK companies (+ DE entities, funds)
│   │   ├── dataset.ts              Lazy singletons, lookup by id
│   │   ├── fixtures/lumen-bank.ts  Hand-built demo companies (Lumen Bank, Harrowmere Group)
│   │   ├── profile/                Profile generator, financials, ownership, similarity, types
│   │   ├── taxonomies/             Industries (~150), signals, regions, CH statuses, SIC, investors
│   │   ├── rng.ts / logo.ts        Seeded RNG; generated SVG monogram logos
│   │   └── types.ts                Company type
│   │
│   ├── criteria/       Criteria registry (every filter is config) + types
│   ├── query/          Query engine (run), sort/paginate, presets, useResultSet hook
│   ├── stats/          Pure statistics functions for the dashboard
│   ├── store/          Zustand stores: query, results, ui (layer stack), tour, saved, collections
│   └── lib/            format (money/dates), event bus, storage, URL state, downloads, nav bridge
│
├── tests/              Vitest: data.test.ts, stats.test.ts, profile.test.ts
└── e2e/
    ├── tour.spec.ts        Tour 1 end to end, off-script recovery, tour menu
    ├── features.spec.ts    Builder, picker, results, save/open/reset, URL state, tabs, Esc layering
    ├── profile.spec.ts     Entry points, all sections, header actions, interactions, tour 2
    ├── shot.mjs            Ad-hoc screenshot helper: node e2e/shot.mjs <name> [flow.mjs]
    ├── profile-shots.mjs   Screenshot every profile section
    └── flows/*.mjs         Scripted UI flows used by the screenshot helpers
```

The codebase is about 10,000 lines of TypeScript and TSX.

---

## 4. Routing and app shell

`src/App.tsx` wraps everything in a `BrowserRouter`:

| Route | Component |
|---|---|
| `/` | `SearchPage` |
| `/companies/:id/:section?` | `CompanyPage` (lazy-loaded) |
| `*` | `SearchPage` |

These parts are global and appear on every route:

- **AppHeader**: sticky at the top on every page. It holds:
  - the logo, which links home
  - the nav menus: *My Northbeam*, *Search*, *News & Reports* and **Company profile**. The Company profile menu lists the Lumen Bank demo plus up to five recently viewed profiles.
  - Help, What's New, the user name and the apps grid
- **Global company search** (typeahead): sits in the "Advanced search" title row on the search page, and in the breadcrumb row on profile pages. Picking a result opens that company's profile.
- **Footer** and **FloatingHelp**: the yellow "Platform tours" pill with an *n / 3* badge and a menu of tours, plus the purple "Need help?" button.
- **Modals**: Add to collection, quick-view drawer, Book a demo, Save search, Open search, and Help.
- **TourEngine**: overlays tooltips and beacons on any page.

`src/lib/nav.ts` provides a **navigate bridge** (`go(path)`). Stores and tour steps use it to change route from outside React components. It also tracks recently viewed profiles.

---

## 5. Data layer

### 5.1 Generated companies (`src/data/generate.ts`)

The generator creates **5,000 fictional UK companies** from a fixed seed (`DATA_SEED` in `config.ts`), so every run produces identical data. Each company has:

- id, name, a generated SVG logo, a one-sentence description and a business description
- industries/buzzwords (from a taxonomy of about 150 items)
- head-office region with lat/lng, a Companies House ID and status (85% Active)
- stage of evolution and tracking status
- signals (Growth, Innovation, Environmental, Social & Governance, Risk)
- founded and ceased dates, fundraisings (date, amount, stage, investors) and their total
- turnover, employees and net assets
- directors (gender, birth year, appointed/resigned), founders and shareholders
- significant events, website, socials and company type
- target markets, imports/exports, SIC codes and senior hires

The distributions are tuned to look believable:

- money is right-skewed (log-normal)
- most companies are at the Seed or Venture stage
- directors are mostly male
- more companies were founded after 2016

**Calibration:** the tour's demo query (Industries = *Artificial Intelligence*, CH status = *Active*, Signals = *Equity fundraising* OR *20% scaleup*) returns **1,907** companies. A unit test keeps this between 1,850 and 1,980.

There are also smaller datasets for the other two entity types: **German legal entities** (400) and **funds** (250).

### 5.2 Demo fixtures (`src/data/fixtures/lumen-bank.ts`)

| Company | Purpose |
|---|---|
| **Lumen Bank** (`lumen-bank`), registered as "Lumen Bank Holding Group Limited" | Fictional UK challenger bank. Every profile section is filled, with numbers in the same ballpark as the spec. |
| **Harrowmere Group** (`harrowmere-group`) | Fictional holding company with a 3-level, 9-node corporate tree, used to demo expand and collapse. |

Lumen Bank headline numbers:

- 16 fundraisings ≈ **£1.42b**
- 2 grants = **£5k**
- 60 key people
- 10 current and 8 previous directors
- **193,153,514 shares** in 9 classes, worth ≈ **£3.28b**
- 40 filings
- **378** news items
- about 150 timeline events back to 2014
- turnover **£880m**, net assets **£862m**, cash **£7.62b**, **3,145** employees

Both fixtures are added to the start of the dataset, so the search side contains 5,002 companies.

### 5.3 Profiles (`src/data/profile/`)

`getProfile(id)` builds a full `CompanyProfile` on demand and caches it. Each profile is **derived from the company's search record**, so both views agree:

- fundraisings become transactions
- directors become people
- signals become chips
- the stage becomes timeline stage periods

A seeded RNG keyed on the company id fills in the rest, so the same company always shows the same profile.

| File | Responsibility |
|---|---|
| `generateProfile.ts` | Builds the profile:<br>• meta: names, legal form, SME status, addresses, location hierarchy, technology, contact<br>• people tables<br>• transactions and investors<br>• accelerators and high-growth lists<br>• filings, news, timeline and recent activity<br>• ownership, corporate tree, commodities, financials, credit info, patents and charges |
| `financials.ts` | Definitions for the six financial tables (P&L, balance sheet, capital & reserve, cash flow, ratios, misc). Statements are built from a few drivers per year, so **subtotals are computed and always reconcile**. |
| `ownership.ts` | Share classes and holdings, with older filings derived from the latest. `groupHoldings()` works out class %, total % and paper worth (shares × price implied by the latest valuation). |
| `similarity.ts` | The 20 most similar companies: 60% TF-IDF cosine similarity over descriptions plus 40% Jaccard overlap of industries. |
| `types.ts` | Profile types: `Seg` (rich text with purple links), `TimelineEvent`, `ActivityItem`, `Transaction`, `Person`, `Holding`, `CorpNode`, `FinYear`, `Filing`, `NewsItem`… |

The profile "today" is `2024-11-15`, which is when Lumen Bank's latest activity happens.

### 5.4 Taxonomies (`src/data/taxonomies/`)

- **industries.ts**: about 150 items, each tagged as an `industry` or a `buzzword`, in 14 groups (some with sub-groups). They sort alphabetically starting "3D printing, Accessories for tech devices, Accountancy and tax, ActiveTech, AdTech…".
- **signals.ts**: a 5-parent tree, laid out in two columns.
- **misc.ts**:
  - regions (with map coordinates)
  - the 14 Companies House statuses
  - stages and their colours
  - tracking statuses
  - SIC codes
  - fictional investors
  - significant events

---

## 6. Mode 1: Advanced Search

### 6.1 Query builder (`src/components/builder/`)

The builder reads as a sentence:

> **Find** [companies ▾] **where** [all ▾] **of the following apply:**

- The **entity** select (companies / German legal entities / funds) relabels the buttons, e.g. "Search for companies" and "+ Add company criteria".
- **all / any** switches between AND and OR. Every row after the first is prefixed "and" or "or" to match.
- **Criterion rows** render entirely from the registry, in one-line or two-line layouts. Value controls:
  - **Tree modal**: Industries and buzzwords. A large modal with group drill-down, a Back row, show-buzzwords / show-industries toggles, Select all, and Confirm, which is enabled only once something is selected.
  - **List popover**: e.g. Companies House status. Filter box, checkbox list and ✓ OK.
  - **Tree popover**: Signals. Two columns, tri-state parent checkboxes, Expand all / Collapse all, search, and Confirm.
  - Text, number range, date range and boolean (operator-only) inputs.
  - Value labels follow one rule: 0 selected = "None selected", 1 = the item's label, more = "N selected".
- **Criteria picker** ("+ Add company criteria"):
  - live search that highlights matches and auto-expands groups
  - Expand all / Collapse all
  - bold groups with counts, e.g. *What the company does (7)*
  - legacy criteria shown in grey
  - an "Include tracked-only criteria" toggle
  - a newly added criterion opens its own picker straight away
- Rows with an empty value are ignored by the query.

### 6.2 Criteria registry (`src/criteria/registry.ts`)

Every filter is a `CriterionDef`: `{ id, label, phrase, valueType, layout, operators, defaultOperator, options, tree, predicate }`. About 60 criteria are defined, across these groups:

- top-level: Name, Location, Collections, Stage, Signals
- Tracking
- Companies House
- Company type and structure
- What the company does
- People (10)
- Funding received (4)
- Significant events (15)
- Financials (3)
- Online presence (2)
- Legacy criteria (6)

### 6.3 Query engine (`src/query/`)

- `run(query, dataset)` combines each criterion's predicate using all or any, and caches results by a hash of the query.
- `sortCompanies` uses a natural, numbers-first name sort ("10Cast, 11x.ai, 1437 Studio…"). Empty values always sort last.
- `pageItems` builds the page list with ellipses (`1 2 … 96 97`).
- `presets.ts` holds the demo query and the German-entities preset.

### 6.4 Results (`src/components/results/`)

- **Tabs**: Search Results | Statistics | Recent Activity | Company News | Map.
- **Summary line** with related searches (+10 more…).
- **Export results to a CSV** downloads the whole filtered set. **Add to collection** (bulk) can use an existing collection or create a new one.
- **Edit table columns**: tick to show a column, drag to reorder; Name is always shown. Optional columns:
  - Turnover, Employees, Stage, Founded
  - Website, CH status, Signals
- **Table**:
  - two-line rows: logo, name, industries, a flag and region, £ amounts and dates on the first line; the description underneath
  - sortable columns: Name, Fundraising Total, Latest Fundraising, plus several optional columns
- **Per-row actions**:
  - **Profile** opens the full company profile
  - 👁 opens a quick-view drawer
  - ≡+ adds the company to a collection
  - the company name is also a link to the profile
- **Pagination** with page size 10, 20, 50 or 100.
- **Empty state** ("Please search to see results / view all 13,996,566 companies") plus the Germany promo panel.

### 6.5 Statistics (`src/components/stats/`, `src/stats/compute.ts`)

Every number is computed live from the current result set. Every card has a **Download ▾** menu offering **PNG**, **SVG** (rendered off-screen with ECharts) and **CSV**.

- **Companies**:
  - tracking status bars
  - six financial KPI pills
  - foundations and cessations per quarter (or net change)
  - active companies over time
  - industry ranking (by industry or buzzword, as % or raw count, top 10 / show all)
  - stage-of-evolution donut
  - ESG signal bars
  - top 10 by amount raised and by turnover
  - gender of directors or founders
  - gender balance of companies
  - directors' age over time (100% stacked area)
- **Fundraisings**:
  - deal-count, total and average-size KPIs
  - deals per quarter and amount raised per quarter
  - most active investors
  - stage of deal
- **MBOs/MBIs**: KPIs, deals per year, and a regional breakdown.

### 6.6 Other tabs

- **Recent Activity**: a dated feed of fundraisings, events, director changes and filings, with type filters and Load more.
- **Company News**: generated headline cards.
- **Map**: a Leaflet UK map with clustered head-office markers. Each popup shows the name and fundraising total, with a link to the profile.

### 6.7 Page actions

- **Save search**: give it a name.
- **Open search**: lists saved searches with date, criteria count and a delete button.
- **Reset search**: clears the builder and results.
- **URL state**: the query lives in `?q=` (base64 JSON). A shared link restores the builder and its results.

---

## 7. Mode 2: Company Profile

`src/pages/company/`. Route: `/companies/:id/:section?`.

### 7.1 Chrome

- The **company header** (logo, name and actions) sticks just below the global header. Its actions:
  - **In N collections** opens a popover. Tick a collection to add the company, untick to remove it, or create a new collection. The label reads "Add to collection" when the company is in none.
  - **PDF** renders every section in sequence and calls `window.print()`, using `print.css`.
  - **CSV** downloads the company's key fields.
  - **Share** opens a modal with the link and a Copy button that shows "Copied" for 2 seconds.
  - **⚠ Report an issue** opens a modal with a section select and a textarea, then shows a toast.
- **Breadcrumb** with the global search bar.
- **Left nav** (sticky) with 15 sections. The active item is a dark pill. Patents and Charges & Mortgages are greyed out and not clickable when there's no data.
- Back and forward move between sections, and the page scrolls to the top on each change. An unknown company id shows a "Company not found" page. An invalid or disabled section redirects to Summary.

### 7.2 Sections

| Section | Contents |
|---|---|
| **Summary** | • Briefing: meta line, description, industry chips, "In collections" list<br>• Signals (yellow circle chips with tooltips)<br>• Mini timeline<br>• Transactions: KPI capsules, Valuation/Events toggle<br>• Details overview<br>• Financials: 8 metric tiles with sparklines and deltas, or a table; credit facts<br>• People<br>• 3 news items<br>• 3 similar-company cards<br>• "See all →" links to the full sections |
| **Details** | • Description & Classifiers<br>• Name and Legal Entity: trading/registered name, CH ID, dates, legal form, SME status tooltip, SIC codes<br>• Academic spinouts<br>• Accelerators and High Growth Lists<br>• Status<br>• Contact: website, phone, emails, social icons, app stores<br>• Location: address and paired location chips<br>• COVID-19<br>• Technology |
| **Timeline** | • Sticky SVG **mini timeline**: line coloured by stage, lettered markers (F/G/E/L/A/R/C/I) that stack, hover tooltips, click to scroll to the event<br>• Event-type filter<br>• **Alternating vertical feed** with month pills, stage-coloured spine and type badges<br>• Significant events have yellow borders and a 🔍 details drawer<br>• Infinite scroll |
| **Recent Activity** | • Grouped by "Added <date>"<br>• Type badges; fundraising changes in red<br>• Filter and lazy loading |
| **Transactions** | • KPIs plus a valuation step chart<br>• Events table: tabs for All, Fundraisings, Grants, MBO/MBIs, Acquisitions, Spinouts; investor lines with flag and status dot; grey "announced" and yellow "verified ✓" amount tags; stage tags; paging<br>• Fundraising investors table with participation counts |
| **People** | • Current key people: function filter, "only my connections", sortable, copy-email with "Copied" tooltip, LinkedIn icons<br>• Current directors<br>• **Directors over time** (dumbbell chart)<br>• People with Significant Control<br>• Secretaries<br>• Previous key people and previous directors<br>• Gender pay gap |
| **Ownership** | • **Filings strip**: monthly grid, click to select a filing<br>• "Show changes from last filing": ▲/▼ deltas and "New" tags<br>• Date stepper and Download as CSV<br>• Shareholder search, share-class filter, people/companies toggle<br>• **Shareholdings table** grouped by class: top 15 plus "View remaining N", class totals and a grand total; sortable columns |
| **Corporate Structure** | • Summary key/value table and an indented tree<br>• Expand, Collapse and Legend buttons, plus a legend bar<br>• **d3-hierarchy SVG tree**: drag to pan, click to expand or collapse; the current company in red; truncated labels with full-name tooltips |
| **Commodity Trade** | • Monthly imports/exports line chart; the ⚙ menu toggles series and date range<br>• Unique-commodity rings<br>• Most traded commodities, ordered by months traded or by unique commodities, with expandable HS sub-codes |
| **Financials** | • Download financial statements (CSV)<br>• Summary card<br>• "GBP" info bar<br>• Six tables with year columns and "+ more years" (up to 5):<br>&nbsp;&nbsp;– dotted-underline tooltips on row labels<br>&nbsp;&nbsp;– grey bold subtotal rows<br>&nbsp;&nbsp;– negatives in brackets |
| **Filing History** | • Type checkboxes (16 categories) with Select all / Clear all, applied only when you click **Update Results**<br>• Paging and page size<br>• Codes such as TM01, AP01, AA, CS01, SH01, RESOLUTIONS, MA<br>• **View PDF** generates a placeholder PDF in a new tab |
| **News** | • Paged article table<br>• Each article lists its tagged companies as links |
| **Similar Companies** | • 20 matches with select-all<br>• Add to collection / "In N collections"<br>• **Not similar** hides the row, with an Undo toast<br>• A bulk action bar (Add to collection / Export CSV) appears when rows are selected |
| **Patents / Charges & Mortgages** | Simple tables, shown only for companies that have data |

---

## 8. Guided tours

### 8.1 Engine (`src/components/tour/TourEngine.tsx`)

- Steps are **data** (`steps.ts`): `{ id, target, placement, text, mode: 'next' | 'action' | 'final', advanceOn, beacon, beaconAt, recover, doneIf, onEnter }`.
- Components emit UI events on a small **event bus** (`src/lib/eventBus.ts`). Action steps advance when their event fires. Examples:
  - `picker:open`
  - `group:expand:<id>`
  - `item:check:<id>`
  - `modal:confirm`
  - `search:run`
  - `tab:statistics`
  - `section:<id>`
- **Targets** are elements marked with `data-tour="…"`. The engine polls for the target, scrolls it into view, and positions the tooltip with floating-ui, re-checking every animation frame.
- **Visuals**:
  - white rounded tooltip with a caret and a step counter
  - yellow **Next** button with a dark border
  - a pulsing yellow **beacon** on the element to click
  - a dimmed final modal
- **Going off-script**: if the target disappears (for example, the user closes the picker), the step waits. After about 0.7 seconds it shows a **recovery hint** pointing at whatever reopens the target.
- The tour auto-starts once, on the first visit. It doesn't auto-start on shared `?q=` links.

### 8.2 Tours (menu: "Platform tours")

| # | Tour | Steps |
|---|---|---|
| 1 | **Build your first search** | 22 steps that build the demo query: add criteria, then *What the company does* → Industries → Software → AI → Confirm. Next, Companies House status → Active → OK. Then Signals → Growth → Equity fundraising + 20% scaleup → Confirm. Finally Search → results → Statistics, ending on the "And that's just the start" modal with Book a demo. |
| 2 | **Explore a company profile** | Opens Lumen Bank, then walks all 15 sections. Sections with copy show a tooltip with Next; a beacon on the next nav item advances when clicked. Ends with "Your tour is finished!" and Book a demo. |
| 3 | **Explore the results table** | 4 steps: table, sorting, column editor, export/collections. |

---

## 9. State management

All stores are Zustand, in `src/store/`.

| Store | Holds |
|---|---|
| `queryStore` | entity, all/any, criteria rows, the "just added" row (to auto-open its picker). Synced to `?q=` while on `/`. |
| `resultsStore` | whether a search has run, the last query run, sort, page, page size, visible columns, active tab and stats sub-tab, quick-view company, collection-modal target |
| `uiStore` | **One layer stack** for every popover and modal. Opening a popover closes other popovers; Esc closes the top-most layer only. |
| `tourStore` | active tour, step index, last tour taken (for the badge) |
| `savedStore` | saved searches |
| `collectionsStore` | collections, including 19 seeded team collections that contain Lumen Bank, with owner initials and tags. These are merged with whatever the browser has already saved. |

Other shared helpers:

- `src/pages/company/ui.tsx` has a small **toast** store.
- `src/lib/format.ts` handles formatting:
  - money: £90.1k / £1.58m / £1.01b
  - dd/mm/yyyy dates
  - "8th May 2024" and "Sept. 12, 2023" styles
  - accounting brackets
  - "A, B and C" lists

---

## 10. Design system

The tokens live in `tailwind.config.ts`.

| Token | Value | Used for |
|---|---|---|
| `primary` | `#4B4291` | buttons, links, outlines |
| `ink` / `text` / `muted` | `#282828` / `#595959` / `#8A8A8A` | headings / body / secondary text |
| `page` / `surface` / `border` | `#F8F8F8` / `#FFFFFF` / `#E3E3E3` | backgrounds and borders |
| `tab-active` | `#343434` | active tabs, selected rows, nav pill |
| `tour-yellow` / `beacon` / `money-yellow` | `#FADD1D` / `#F3E105` | tour UI, KPI tags, verified amounts, signal circles |
| Chart colours | blue `#467BAD`, green `#34C345`, teal `#4DA29D`, magenta `#B61483`, mint `#4CD3A0` | statistics |
| Stage colours | Seed `#50A198`, Venture `#3F7DB6`, Growth `#B61483`, Established `#333`, Zombie `#E0662E`, Exited `#34C345`, Dead `#CCC` | donuts, timeline, tags |
| Profile badges | green `#E2F3EA`, pink `#F6DCE6`, red `#F7D6D6`, orange `#FBE3CC`, blue `#DCEAF5` | timeline and activity type badges |
| `nav-disabled` / `collections-btn` | `#A9A6C4` / `#E4E1F3` | disabled nav items, "In N collections" |

Base sizes:

- **Text**: 15px Public Sans.
- **Page title**: 28px/300.
- **Buttons**: 30px tall, 3px radius.
- **Cards**: 4px radius.
- **Tour tooltips**: 10px radius.
- **Content widths**: 1040px for search, 1170px for results, 1440px for profile pages.

---

## 11. Testing

### Unit tests: Vitest (31)

- `tests/data.test.ts`:
  - the dataset is deterministic and unique
  - about 85% of companies are Active
  - **calibration** (the demo query returns about 1,900)
  - query engine semantics (empty rows ignored, is / is not, any ⊇ all, ranges)
  - numbers-first sort and the page list
  - money and date formats
  - taxonomy order and size
  - picker group counts
- `tests/stats.test.ts`: every statistics function (totals, quarter ranges, ranking, age bands summing to 100%, top-10 ordering).
- `tests/profile.test.ts`:
  - Lumen Bank fixture counts
  - **ownership adds up** (193,153,514 shares, £3.28b, 100%)
  - **financial statements reconcile** every year (gross profit, EBITDA, liabilities, net assets = shareholder funds, cash movement)
  - corporate tree shapes
  - deterministic generation
  - similarity returns 20 matches and excludes the company itself
  - sort order

### End-to-end tests: Playwright (13), at 1844×1032

- `tour.spec.ts`:
  - tour 1 runs from start to finish with no manual help, taking a screenshot at every step
  - off-script recovery
  - auto-start happens once, and the tours menu works
- `features.spec.ts`:
  - builder: all/any, remove, empty rows, entity switch
  - picker: search highlight, tracked-only toggle
  - results: sort, paging, page size, column editor, collections, quick view
  - save / open / reset and the URL `?q=` round trip
  - Activity, News and Map tabs
  - Esc layering and the focus trap
- `profile.spec.ts`:
  - navbar and results-row entry points
  - every section renders; disabled nav; deep links; back/forward; unknown id
  - collections popover, CSV, Share copy, Report toast
  - timeline drawer
  - ownership totals, expand and changes
  - tree collapse and legend
  - filings Update Results
  - Not similar + Undo
  - financial statements download
  - **tour 2 end to end**

Every e2e test also checks for **zero console errors**.

### Screenshot helpers

```bash
node e2e/shot.mjs results e2e/flows/results.mjs      # any page after a scripted flow
node e2e/profile-shots.mjs lumen-bank                # every profile section
```

---

## 12. How to extend

| Task | Where |
|---|---|
| **Add a search filter** | Add a `CriterionDef` in `src/criteria/registry.ts` and put it in `PICKER_TREE`. The builder, query engine and URL state all pick it up automatically. |
| **Add a stats chart** | Add a pure function in `src/stats/compute.ts`, then render it inside a `ChartCard` in `src/components/stats/`. Pass `option` and `csv` to get downloads. |
| **Add a profile section** | Add it to `SECTIONS` in `src/pages/company/sections.ts`, create `sections/<Name>.tsx`, and register it in `VIEWS` in `CompanyPage.tsx`. |
| **Add profile data** | Extend `CompanyProfile` in `src/data/profile/types.ts` and fill it in `generateProfile.ts`. Lumen-specific values go in the fixture. |
| **Add a tour step** | Add an entry to the right array in `src/components/tour/steps.ts`. Target a `data-tour` key; for action steps, emit the matching event with `bus.emit(...)` from the component. |
| **Rebrand** | Change `BRAND_NAME` in `src/config.ts` and the colour tokens in `tailwind.config.ts`. |

---

## 13. Known gaps and decisions

- **No reference screenshots** were provided for either mode (`./reference/` and `./reference-profile/` were never added). The look follows the written specs and their design tokens, and pixel matching against the original product hasn't been done.
- **Header and search placement** (changed on request): the top header stays visible while scrolling on every page. The company search bar sits in the page's title row (search page) or breadcrumb row (profile pages) instead of the header.
- **Three tours** are listed, so the Platform tours badge shows e.g. "2/3" rather than the recording's "2/2".
- The original side drawer is kept as a **quick view** (👁 on result rows, activity feed, map popups) with an "Open full profile" button.
- **Foundations chart**: cessations are drawn as orange negative bars.
- **Chart ⚙ menus** toggle data labels, point markers and series. Their exact behaviour wasn't specified.
- **HTML-based cards** (KPIs, rankings, tracking) export PNG/SVG as an equivalent ECharts bar chart. Their CSV export is exact.
- Flags are inline SVGs, because Windows doesn't render flag emoji.
- **Filing PDFs** are jsPDF placeholders. **Map tiles** come from OpenStreetMap and need network access.
- **Bundle size**: ECharts, Leaflet, jsPDF and the profile page are lazy-loaded. The main chunk (mostly the faker locale) still triggers Vite's 500 kB warning.

---

## 14. Part 3: CMA tender gaps (prototype for client demo)

Every screen carries a grey **"Prototype for client demo. All data shown is sample data."** banner; the same notice appears in the footer, the page title and every exported file. Each claim about the real service (allowances, prices, update frequencies, lags, historic depth, SLAs) lives in `src/config/tender.ts` and is shown with a yellow **Sample** tag until the bid team confirms it.

**Start here:** `/tender-coverage` lists every tender gap with its status and a **Show me** link. It also has demo controls (set the allowance near its limit, simulate monitoring events). The 15-minute walkthrough is in `docs/DEMO_SCRIPT.md`; regenerate it with `npm run docs:demo`.

| Area | Where | Key code |
|---|---|---|
| International coverage (about 12,400 companies, 28 countries, UK and Ireland default) | Search sentence "in [countries]", Map, Statistics, every profile | `src/data/international.ts`, `src/data/countries/`, `src/components/ui/CountrySelect.tsx` |
| Provenance (sources, coverage matrix, QA, corrections, card footers, ⓘ) | `/data-sources`, every profile card | `src/data/sources.ts`, `src/pages/company/provenance.tsx` |
| Comparison (≤6, currency, period alignment, differences only) | `/compare`, `/comparisons`, compare tray | `src/compare/model.ts`, `src/pages/compare/` |
| Analysis grid, formula engine, report builder | Results → Analyse, `/reports` | `src/analysis/`, `src/formula/`, `src/reports/` |
| Exports (Excel with real formulas, PDF, CSV), bulk jobs, allowance | Everywhere; `/downloads`, `/plan` | `src/export/` |
| Mock auth, usage tracking, Admin console, audit | `/sign-in`, `/admin/*`, `/account` | `src/auth/`, `src/usage/`, `src/admin/` |
| People across companies, person profiles, people search | `/people/:id`, `/?find=people` | `src/data/persons.ts`, `src/pages/people/`, `src/criteria/people.ts` |
| Ultimate and beneficial ownership, groups, PSC | Ownership and Corporate structure tabs | `src/data/groups.ts` |
| Risk and financial criteria (credit, insolvency, CCJs, filings, years) | Picker groups Risk, Ownership, Financial accounts, Filing dates | `src/criteria/risk.ts`, `src/data/riskIndex.ts`, `src/data/finIndex.ts` |
| Historical depth (up to 20 years), "Data available from" badges | Financials tab | `src/data/finIndex.ts` |
| News categories, monitoring, alerts bell and inbox | `/news`, `/monitoring`, `/alerts` | `src/data/news.ts`, `src/monitoring/` |
| Accessibility (WCAG 2.2 AA target) and help | `/accessibility`, `/help`, `/support`, `?` shortcuts | `src/pages/info/`, `e2e/a11y.spec.ts` |
| Production readiness | `/whats-new`, `/status`, `/governance`; CI | `.github/workflows/ci.yml`, `lighthouserc.json`, `docs/` |

**Deployment:** set `VITE_PUBLIC_BASE_URL` and `VITE_BASE_PATH` (see `.env.example` and `docs/DEPLOY.md`). SPA fallback and security headers are provided for Netlify (`public/_redirects`, `public/_headers`), Vercel (`vercel.json`) and nginx (`deploy/nginx.conf`).

**Scripts:** `npm run lint`, `npm run typecheck`, `npm run test` (118 unit tests), `npm run e2e` (about 90 Playwright tests, including axe on 43 routes and keyboard-only journeys), `npm run ci` (all of them).

**Known gaps (part 3):**
- The main JavaScript chunk is about 1.7 MB (faker locales). Move generation to a build step or a worker.
- Exported PDFs are not tagged for screen readers.
- Email alerts are simulated.
- Usage and admin data live in the browser (`localStorage`).
