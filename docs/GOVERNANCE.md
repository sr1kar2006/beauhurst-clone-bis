# Governance

> Prototype for client demo. `TODO(bid team)` marks every commitment still to be confirmed. Summary in the app at **/governance**.

## Contract and service governance

| Forum | Frequency | Attendees | Purpose |
|---|---|---|---|
| Service review | Monthly (`TODO`) | Account manager, client service owner | KPIs, usage, incidents, roadmap |
| Steering group | Quarterly (`TODO`) | Senior sponsors | Performance against contract, changes, risks |
| Data quality review | Quarterly (`TODO`) | Data lead, client analysts | Corrections, coverage, limitations |

## Change management

- Release cadence: fortnightly, with emergency fixes as needed (Sample).
- Every change goes through CI: lint, typecheck, unit tests, end-to-end tests with axe accessibility checks, dependency audit and Lighthouse budgets.
- Release notes are published in the product (**/whats-new**, generated from `CHANGELOG.md`).
- Changes that affect data definitions or user-visible behaviour are announced 10 working days ahead (`TODO(bid team)`).

## Licences and access

- 30 named user licences; every user receives full functionality. Administrators also manage users and see usage reports.
- Seat limits are enforced when adding users; removals and role changes are recorded in the audit log.
- Bulk-export allowance and overage charges are shown wherever a bulk export starts (**/plan**). All figures are Sample until confirmed.

## Data protection

- Personal data limited to what public registers publish (officers' month and year of birth only).
- Usage data visible only to the client organisation's administrators; retention 24 months (Sample).
- `TODO(bid team)`: DPIA reference, controller/processor roles, sub-processor list, international transfer mechanism.

## Security

- No secrets in the client; security headers and a content security policy for every hosting target (`public/_headers`, `vercel.json`, `deploy/nginx.conf`).
- `TODO(bid team)`: certifications (ISO 27001, Cyber Essentials Plus), penetration testing cadence, vulnerability disclosure policy.

## Accessibility

Target WCAG 2.2 AA; see `ACCESSIBILITY.md` and **/accessibility**.
