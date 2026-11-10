# Service support

> Prototype for client demo. All values are **Sample** placeholders from `src/config/tender.ts` until confirmed. `TODO(bid team)` marks commitments.

## Support model

| Item | Proposed (sample) | Status |
|---|---|---|
| Support hours | Monday to Friday, 08:00 to 18:00 UK time, excluding bank holidays | `TODO(bid team)` |
| Channels | In-app contact form; support@example.org; named account manager by telephone | `TODO(bid team)` |
| Availability target | 99.5% monthly, excluding planned maintenance | `TODO(bid team)` |
| Planned maintenance | Sundays 06:00 to 08:00 UK time, 5 working days' notice | `TODO(bid team)` |

## Severity levels

| Level | Example | Target response | Target resolution |
|---|---|---|---|
| P1 Critical | Service unavailable for all users | 30 minutes | 4 hours |
| P2 High | Core feature unavailable (search, export) | 2 hours | 1 working day |
| P3 Medium | Feature degraded, workaround exists | 1 working day | 5 working days |
| P4 Low | Question, cosmetic issue or data query | 2 working days | Next release |

Shown in the app at **/support** with a contact form. Status page stub at **/status**.

## Onboarding and training

- Guided tours in the product (search, company profile, results table).
- Help centre at **/help** with searchable articles, video placeholders with transcripts, and a PDF user guide generated from the articles.
- `TODO(bid team)`: number of live training sessions, train-the-trainer offer, refresher cadence.

## Account management

- Named account manager and quarterly service reviews: `TODO(bid team)`.
- Usage reports for administrators are built into the Admin console (**/admin/usage**) and exportable for any period.

## Incident management

Detection (monitoring and alerts) → triage by severity → user communication via in-app banner and email → fix → post-incident review within 5 working days for P1 and P2. `TODO(bid team)`: confirm the tooling and the escalation contacts.
