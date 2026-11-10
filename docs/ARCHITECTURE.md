# Architecture

> Prototype for client demo. All data shown is sample data. `TODO(bid team)` marks commitments still to be confirmed.

## Prototype architecture (what exists today)

A static single-page application. Every screen runs in the browser over a deterministic, generated dataset; there is no back end.

| Layer | Technology | Where |
|---|---|---|
| UI | React 18, TypeScript, Tailwind CSS | `src/pages`, `src/components` |
| Routing | React Router (works under any sub-path via `VITE_BASE_PATH`) | `src/App.tsx` |
| State | Zustand stores, persisted to `localStorage` where noted | `src/store`, `src/auth`, `src/export/stores.ts`, `src/monitoring` |
| Data | Seeded generators: about 12,000 companies in 28 countries, about 19,000 persons, groups, risk, 20-year financials | `src/data` |
| Search | Criteria registry (each filter is data with a predicate) and a memoised query engine | `src/criteria`, `src/query` |
| Analysis | TanStack Table grid; formula engine (tokenizer, Pratt parser, evaluator, Excel translator; no `eval`) | `src/analysis`, `src/formula` |
| Exports | One export service: Excel (exceljs, real formulas), PDF (jsPDF + autotable), CSV; bulk jobs in a Web Worker, zipped with JSZip | `src/export` |
| Charts | ECharts (with accessible descriptions and "View as table"); d3-force for the people network; Leaflet map | `src/components/stats`, `src/pages/people` |
| Usage and admin | Mock auth, usage tracker, 12 months of seeded usage, report aggregation (pure functions) | `src/auth`, `src/usage`, `src/admin` |
| Configuration | Every service claim in one file with a Sample/confirmed status | `src/config/tender.ts` |

### Key flows

- **Search:** sentence header (entity and countries) → criteria from the registry → `run()` filters the dataset → results, Analyse grid, statistics, map.
- **Profile:** `getProfile(id)` derives every section from the company record. Country-aware localisation, group/PSC data and news categories are applied after the build. Financials come from the shared `finIndex`, so search, grid and profile agree.
- **Export:** surface builds an `ExportSpec` → `requestExport()` → direct download, or (above the bulk threshold) the allowance modal → worker job → Downloads page.

## Target production architecture (proposal)

`TODO(bid team)`: confirm hosting, data platform and identity provider.

```
Browser SPA ──HTTPS──► API gateway / BFF ──► Search service (OpenSearch/Elasticsearch)
                              │              ├► Company & person store (PostgreSQL)
                              │              ├► Export workers (queue + object storage, signed URLs)
                              │              └► Alerts service (event stream → rules → in-app + email)
                              └► Identity provider (SSO / SAML / OIDC), audit and usage logging
Ingestion: registry and partner feeds → validate → match & de-duplicate → enrich → human review → publish (see DATA_PROVENANCE.md)
```

| Prototype component | Production equivalent |
|---|---|
| Generated dataset in the browser | Search index + relational store, refreshed by ingestion pipelines |
| `localStorage` stores | Per-user and per-organisation tables behind the API |
| Mock sign-in | Organisation SSO with role claims; seat count enforced server side |
| Usage tracker (client) | Server-side session and request logging with retention policy |
| Web Worker bulk export | Queued export jobs with object storage and expiry |
| Simulated email | Transactional email service with unsubscribe and digests |

## Quality gates

`npm run ci` runs lint, typecheck, unit tests (formula engine, usage reports, criteria, ownership, persons, data), build and Playwright end-to-end tests including axe on every route and keyboard-only journeys. GitHub Actions adds `npm audit` and Lighthouse budgets (`.github/workflows/ci.yml`, `lighthouserc.json`).
