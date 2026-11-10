# Demo script: closing the CMA tender gaps

> Prototype for client demo. All data shown is sample data. Figures tagged **Sample** in the app are placeholders, not commitments.
> Generated from `src/tender/requirements.ts` by `npm run docs:demo`. The same list, with "Show me" links, is in the app at **/tender-coverage**.

## Before you start (2 minutes before the meeting)

- Open the app; you are signed in as **Simone Hartley (Administrator)**. Use the user menu → Switch user to show a Member.
- On **/tender-coverage** → Demo controls: press **Reset to 61,000** (allowance) so the bulk export shows "No additional charge".
- Optional: **Monitor** Tusklab AG (/companies/de-1) so "Simulate new events" has something to show.

## Walkthrough (about 15 minutes, Critical first)

| Time | Area | Route | What to click / say | Tender requirement | Priority |
|---|---|---|---|---|---|
| 00:00 | Global | `/` | Point at the grey banner above the header and the footer notice. | Prototype labelling on every screen and every export | Critical |
| 00:22 | Global | `/plan` | Every figure on Plan & allowances carries a yellow Sample tag. | Every service claim comes from one config file and shows a "Sample" tag | Critical |
| 00:43 | Global | `/tender-coverage` | Explain VITE_PUBLIC_BASE_URL / VITE_BASE_PATH (see docs/DEPLOY.md). | No hardcoded domain; works under any sub-path; noindex | Critical |
| 01:05 | CMA clarification | `/account` | Account page: "Licences: 30 of 30 assigned · Full access for all users". | All 30 users receive full functionality; admins only add the Admin console | Critical |
| 01:26 | CMA clarification | `/plan` | Plan & allowances: allowance, overage charge, reset date, fair use. | Bulk-export allowance and charges clearly defined | Critical |
| 01:48 | CMA clarification | `/companies/de-1` | Open a German and a US company; every section in the left nav is populated. | International companies have the same profile depth as UK and Irish companies | Critical |
| 02:10 | International coverage | `/` | Open the "in [United Kingdom, Ireland]" selector in the search sentence. | Country dropdown of all countries with UK and Ireland first | Critical |
| 02:31 | International coverage | `/` | Add criteria → Location → Country. | Country and Listed / Private search criteria | Critical |
| 02:53 | International coverage | `/` | Statistics tab → Companies by country. | UK, Irish and global, public and private companies | Critical |
| 03:14 | International coverage | `/companies/de-1/details` | Profile Details card shows e.g. "Handelsregister HRB …" and "€12.4m (≈£10.6m)". | Country-aware registry IDs, legal forms, local currency with GBP equivalent | Critical |
| 03:36 | International coverage | `/` | Run a search for all countries, then open the Map tab. | World map and country statistics | Critical |
| 03:58 | Real data & provenance | `/data-sources` | Sources tab: expand Companies House. | Sources, licences and methodology explained | Critical |
| 04:19 | Real data & provenance | `/data-sources#coverage` | Coverage matrix: UK vs Ireland vs Germany. | Historic depth and update frequency per dataset and country | Critical |
| 04:41 | Real data & provenance | `/data-sources#freshness` | Freshness tab: lag distribution chart. | Filing-to-availability times | Critical |
| 05:02 | Real data & provenance | `/data-sources#qa` | QA tab: six-step pipeline. | Quality assurance process | Critical |
| 05:24 | Real data & provenance | `/data-sources#corrections` | Corrections tab: report an error, see "My reported issues". | Known limitations and correction process | Critical |
| 05:46 | Real data & provenance | `/companies/lumen-bank/financials` | Card footers show source and dates; click ⓘ next to Turnover. | Field-level provenance on the company profile | Critical |
| 06:07 | Comparison | `/compare?ids=gb-1,ie-1,de-1,us-1` | Compare UK, Irish, German and US companies. | Compare UK and international companies side by side | Critical |
| 06:29 | Comparison | `/compare?ids=gb-1,ie-1,de-1,us-1` | Switch GBP → EUR; note the FX date and period note. | Currency conversion and period alignment | Critical |
| 06:50 | Comparison | `/compare?ids=gb-1,ie-1,de-1,us-1` | Toggle "Show differences only". | Differences only, best and worst highlighting, industry median | Critical |
| 07:12 | Reports & exports | `/` | Results → Analyse → add column "turnover / employees". | Manipulate data for calculations (analysis grid, calculated columns) | Critical |
| 07:34 | Reports & exports | `/reports/rep-demo` | Open a saved report, Run again, then preview. | Customised reports | Critical |
| 07:55 | Reports & exports | `/` | Export results to Excel; open the Read me and Sources sheets. | Excel and PDF exports everywhere | Critical |
| 08:17 | Reports & exports | `/downloads` | Export all results → job with progress → zip on Downloads. | Bulk download and analysis | Critical |
| 08:38 | Administrator reporting | `/admin/users` | Try Add user at 30/30, remove one, then add. | Add and remove users (30 licences) | Critical |
| 09:00 | Administrator reporting | `/admin/usage` | Pick "Last quarter", drill into a user session log. | Active users, last login, sessions, connection times and views over custom periods | Critical |
| 09:22 | Administrator reporting | `/admin/audit` | Filter by "User removed". | Audit log | Critical |
| 09:43 | People across companies | `/people/p4` | Open a person from a profile; current/previous appointments and Gantt. | Individuals' current and previous directorships and other positions | Critical |
| 10:05 | People across companies | `/people/p4` | Person page → Network graph → View as list. | Network of co-directors | Critical |
| 10:26 | People across companies | `/?find=people` | Find [people] where number of current appointments ≥ 3. | People search and "previous directors" criterion | Critical |
| 10:48 | Ultimate & beneficial ownership | `/companies/de-1/ownership` | Ownership chain diagram and PSC table. | Ownership chain to ultimate parent and UBOs; PSC nature of control | High |
| 11:10 | Ultimate & beneficial ownership | `/companies/lumen-bank/ownership` | Compare two filing dates. | Historic ownership and subsidiaries | High |
| 11:31 | Searchable risk & financial data | `/` | Add criteria → Risk → Insolvency status. | Search by credit, insolvency, ownership, people, financials and filing dates | High |
| 11:53 | Historical depth | `/companies/c144/financials` | Years: All; note the "Data available from" badge. | Up to 20 years of history with "available from" declarations | High |
| 12:14 | News & monitoring | `/news` | Filter by "Insolvency & administration". | News categories with source links | High |
| 12:36 | News & monitoring | `/tender-coverage` | Monitor a company, Simulate new events below, then open the bell. | Monitoring and alerts | High |
| 12:58 | Production readiness | `/governance` | Service & governance page; docs/ folder. | CI, error handling, security headers, governance documentation | High |
| 13:19 | Help & accessibility | `/accessibility` | Tab through a search; show "View as table" on a chart. | WCAG 2.2 AA, keyboard operation, accessibility statement | Medium |
| 13:49 | Help & accessibility | `/help` | Download the PDF user guide; open Support SLAs. | Help centre, training materials and support arrangements | Medium |

Total: about 14 minutes for 39 requirements.

## Talking points for each Critical area

### Global

- **Prototype labelling on every screen and every export.** Point at the grey banner above the header and the footer notice. (`/`, status: Done)
- **Every service claim comes from one config file and shows a "Sample" tag.** Every figure on Plan & allowances carries a yellow Sample tag. (`/plan`, status: Done)
- **No hardcoded domain; works under any sub-path; noindex.** Explain VITE_PUBLIC_BASE_URL / VITE_BASE_PATH (see docs/DEPLOY.md). (`/tender-coverage`, status: Done)

### CMA clarification

- **All 30 users receive full functionality; admins only add the Admin console.** Account page: "Licences: 30 of 30 assigned · Full access for all users". (`/account`, status: Done)
- **Bulk-export allowance and charges clearly defined.** Plan & allowances: allowance, overage charge, reset date, fair use. (`/plan`, status: Done)
- **International companies have the same profile depth as UK and Irish companies.** Open a German and a US company; every section in the left nav is populated. (`/companies/de-1`, status: Done)

### International coverage

- **Country dropdown of all countries with UK and Ireland first.** Open the "in [United Kingdom, Ireland]" selector in the search sentence. (`/`, status: Done)
- **Country and Listed / Private search criteria.** Add criteria → Location → Country. (`/`, status: Done)
- **UK, Irish and global, public and private companies.** Statistics tab → Companies by country. (`/`, status: Done)
- **Country-aware registry IDs, legal forms, local currency with GBP equivalent.** Profile Details card shows e.g. "Handelsregister HRB …" and "€12.4m (≈£10.6m)". (`/companies/de-1/details`, status: Done)
- **World map and country statistics.** Run a search for all countries, then open the Map tab. (`/`, status: Done)

### Real data & provenance

- **Sources, licences and methodology explained.** Sources tab: expand Companies House. (`/data-sources`, status: Done)
- **Historic depth and update frequency per dataset and country.** Coverage matrix: UK vs Ireland vs Germany. (`/data-sources#coverage`, status: Done)
- **Filing-to-availability times.** Freshness tab: lag distribution chart. (`/data-sources#freshness`, status: Done)
- **Quality assurance process.** QA tab: six-step pipeline. (`/data-sources#qa`, status: Done)
- **Known limitations and correction process.** Corrections tab: report an error, see "My reported issues". (`/data-sources#corrections`, status: Done)
- **Field-level provenance on the company profile.** Card footers show source and dates; click ⓘ next to Turnover. (`/companies/lumen-bank/financials`, status: Done)

### Comparison

- **Compare UK and international companies side by side.** Compare UK, Irish, German and US companies. (`/compare?ids=gb-1,ie-1,de-1,us-1`, status: Done)
- **Currency conversion and period alignment.** Switch GBP → EUR; note the FX date and period note. (`/compare?ids=gb-1,ie-1,de-1,us-1`, status: Done)
- **Differences only, best and worst highlighting, industry median.** Toggle "Show differences only". (`/compare?ids=gb-1,ie-1,de-1,us-1`, status: Done)

### Reports & exports

- **Manipulate data for calculations (analysis grid, calculated columns).** Results → Analyse → add column "turnover / employees". (`/`, status: Done)
- **Customised reports.** Open a saved report, Run again, then preview. (`/reports/rep-demo`, status: Done)
- **Excel and PDF exports everywhere.** Export results to Excel; open the Read me and Sources sheets. (`/`, status: Done)
- **Bulk download and analysis.** Export all results → job with progress → zip on Downloads. (`/downloads`, status: Done)

### Administrator reporting

- **Add and remove users (30 licences).** Try Add user at 30/30, remove one, then add. (`/admin/users`, status: Done)
- **Active users, last login, sessions, connection times and views over custom periods.** Pick "Last quarter", drill into a user session log. (`/admin/usage`, status: Done)
- **Audit log.** Filter by "User removed". (`/admin/audit`, status: Done)

### People across companies

- **Individuals' current and previous directorships and other positions.** Open a person from a profile; current/previous appointments and Gantt. (`/people/p4`, status: Done)
- **Network of co-directors.** Person page → Network graph → View as list. (`/people/p4`, status: Done)
- **People search and "previous directors" criterion.** Find [people] where number of current appointments ≥ 3. (`/?find=people`, status: Done)

## If something goes wrong

- Refresh the page: all demo state is in the browser and survives reloads.
- To reset everything, clear site data for the demo URL (resets users, collections, reports, alerts and exports to the seeded state).
- TODO(bid team): add presenter contact and fallback recording link.
