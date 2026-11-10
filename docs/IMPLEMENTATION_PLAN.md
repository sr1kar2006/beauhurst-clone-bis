# Implementation plan

> Prototype for client demo. Dates and resourcing are `TODO(bid team)`. Phases follow the gaps closed in the prototype (see **/tender-coverage**).

## Phases

| Phase | Weeks (`TODO`) | Scope | Exit criteria |
|---|---|---|---|
| 0. Mobilisation | 1–2 | Contract, governance forums, environments, SSO set-up, 30 named users | Users can sign in; admins can manage seats |
| 1. Core data and search | 3–8 | UK and Ireland registries, international partner feeds, search, profiles, provenance | Coverage matrix confirmed; data acceptance tests pass |
| 2. Analysis and exports | 6–10 | Comparison, analysis grid and formulas, report builder, Excel/PDF/CSV, bulk exports and allowance | Exports reconcile to source; allowance metering verified |
| 3. People, ownership and risk | 8–12 | Persons index, ultimate and beneficial ownership, risk and financial criteria, 20-year history | Matching accuracy targets met (`TODO`) |
| 4. Monitoring and news | 10–13 | News categories, alert rules, email digests | Alert latency within target (`TODO`) |
| 5. Accessibility, training and go-live | 12–14 | WCAG 2.2 AA audit, help centre, training, support handover | External audit passed; training delivered |
| 6. Hypercare | 15–18 | Daily check-ins, priority fixes | Stable for 4 weeks; move to business as usual |

## Dependencies and risks

| Item | Owner | Mitigation |
|---|---|---|
| Deployment URL and hosting | Faisal (`TODO`) | Prototype builds for any sub-path; configs for Netlify, Vercel and nginx |
| Partner data licences | Bid team (`TODO`) | Named fallback partners per region |
| SSO integration | Client IT (`TODO`) | Early test tenant in Phase 0 |
| Confirmed SLAs, allowance and prices | Bid team (`TODO`) | All shown as Sample in the prototype until confirmed |

## Acceptance

Each phase is accepted against the tender requirements list (`src/tender/requirements.ts`), which also drives the in-app traceability page and `DEMO_SCRIPT.md`.
