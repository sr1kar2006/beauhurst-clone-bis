# Business continuity

> Prototype for client demo. All targets are **Sample** placeholders. `TODO(bid team)` marks commitments.

## Objectives

| Measure | Proposed (sample) |
|---|---|
| Recovery point objective (RPO) | 1 hour |
| Recovery time objective (RTO) | 4 hours |
| Availability | 99.5% monthly |
| Backups | Daily full, hourly incremental, retained 35 days (`TODO`) |
| Hosting | UK-hosted cloud, two availability zones (`TODO`) |

## Scenarios

| Scenario | Impact | Response |
|---|---|---|
| Loss of an availability zone | Degraded performance | Automatic failover to the second zone |
| Data source outage (registry or partner) | Stale data for that source | Serve last good data; banner on affected profiles; backfill on recovery |
| Bad data release | Incorrect values | Roll back to the previous versioned release; corrections process |
| Export service failure | Bulk exports delayed | Jobs queue and retry; standard exports unaffected |
| Supplier failure (partner data) | Coverage gap for affected countries | Contractual step-in rights; alternative partner (`TODO(bid team)`) |
| Key staff unavailable | Slower support | Documented runbooks; shared on-call rota |

## Testing

- Restore test: quarterly (`TODO(bid team)`).
- Full disaster recovery exercise: annually, with a written report to the steering group (`TODO(bid team)`).

## Prototype note

The prototype is a static site with no server-side state. Demo data lives in the browser and can be reset by clearing site data; the build can be redeployed from `dist/` to any static host in minutes (see `DEPLOY.md`).
