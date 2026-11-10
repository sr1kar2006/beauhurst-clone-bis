import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { seedUsage, classify, type UsageLog } from '../src/usage/model';
import { usageReport, sessionLog, viewsReport, presetRange, fmtDuration } from '../src/usage/report';
import { SEED_USERS } from '../src/auth/users';

const TODAY = new Date('2026-11-09T12:00:00Z');
const DAY = 864e5;

describe('seeded usage', () => {
  const log = seedUsage(TODAY);
  it('covers 12 months for the 30 users, weekday-heavy, with inactive users', () => {
    expect(SEED_USERS).toHaveLength(30);
    expect(SEED_USERS.filter((u) => u.role === 'Administrator')).toHaveLength(3);
    const first = Math.min(...log.sessions.map((s) => s.start));
    expect(TODAY.getTime() - first).toBeGreaterThan(360 * DAY);
    const weekend = log.sessions.filter((s) => [0, 6].includes(new Date(s.start).getUTCDay())).length;
    expect(weekend / log.sessions.length).toBeLessThan(0.08);
    const byUser = new Map<string, number>();
    log.sessions.forEach((s) => byUser.set(s.userId, (byUser.get(s.userId) ?? 0) + 1));
    expect(byUser.get('u28') ?? 0).toBe(0); // invited, never signed in
    expect(byUser.get('u24') ?? 0).toBeLessThan(20); // rarely active
    expect(Math.max(...byUser.values())).toBeGreaterThan(150);
  });
  it('is deterministic', () => { expect(seedUsage(TODAY).sessions.length).toBe(log.sessions.length); });
});

describe('usage report aggregation', () => {
  const users = SEED_USERS.slice(0, 3);
  const t = Date.UTC(2026, 10, 2, 9); // Mon 2 Nov 2026 09:00
  const log: UsageLog = {
    sessions: [
      { id: 's1', userId: 'u01', start: t, end: t + 30 * 60e3 },
      { id: 's2', userId: 'u01', start: t + DAY, end: t + DAY + 10 * 60e3 },
      { id: 's3', userId: 'u02', start: t + 2 * DAY, end: t + 2 * DAY + 20 * 60e3 },
      { id: 'old', userId: 'u03', start: t - 40 * DAY, end: t - 40 * DAY + 60 * 60e3 },
    ],
    views: [
      { userId: 'u01', sessionId: 's1', ts: t + 60e3, durationMs: 60e3, section: 'company', entityType: 'company', entityId: 'lumen-bank', label: 'Lumen Bank' },
      { userId: 'u01', sessionId: 's1', ts: t + 2 * 60e3, durationMs: 60e3, section: 'search' },
      { userId: 'u02', sessionId: 's3', ts: t + 2 * DAY + 60e3, durationMs: 60e3, section: 'company', entityType: 'company', entityId: 'lumen-bank', label: 'Lumen Bank' },
    ],
    exports: [{ userId: 'u02', ts: t + 2 * DAY + 5 * 60e3, rows: 100, format: 'xlsx', title: 'x' }],
  };
  const range = { from: Date.UTC(2026, 10, 1), to: Date.UTC(2026, 10, 8) };
  const rep = usageReport(log, users, range);
  it('KPIs for the period exclude sessions outside it', () => {
    expect(rep.kpis).toEqual({ activeUsers: 2, sessions: 3, avgSessionMs: 20 * 60e3, connectionMs: 60 * 60e3, views: 3, exports: 1 });
  });
  it('per-user rows, last login and daily active users', () => {
    const u1 = rep.perUser.find((r) => r.user.id === 'u01')!;
    expect(u1).toMatchObject({ sessions: 2, connectionMs: 40 * 60e3, views: 2, exports: 0, lastLogin: t + DAY });
    expect(rep.perUser.find((r) => r.user.id === 'u03')!).toMatchObject({ sessions: 0, lastLogin: t - 40 * DAY });
    expect(rep.daily).toHaveLength(7);
    expect(rep.daily.find((d) => d.day === '2026-11-02')!.active).toBe(1);
  });
  it('views by section and most viewed companies', () => {
    expect(rep.bySection).toEqual([{ section: 'company', views: 2 }, { section: 'search', views: 1 }]);
    expect(rep.topCompanies).toEqual([{ id: 'lumen-bank', name: 'Lumen Bank', views: 2, users: 2 }]);
  });
  it('session log and views report for one user', () => {
    const sl = sessionLog(log, 'u02', range);
    expect(sl).toHaveLength(1);
    expect(sl[0]).toMatchObject({ durationMs: 20 * 60e3, pages: 1 });
    expect(sl[0].exports).toHaveLength(1);
    expect(viewsReport(log, 'u01', range).map((v) => v.entityId)).toEqual(['lumen-bank']);
  });
  it('preset ranges', () => {
    const r7 = presetRange('7d', TODAY);
    expect((r7.to - r7.from) / DAY).toBe(7);
    expect(new Date(presetRange('quarter', TODAY).from).toISOString().slice(0, 10)).toBe('2026-07-01');
    expect(new Date(presetRange('ytd', TODAY).from).toISOString().slice(0, 10)).toBe('2026-01-01');
    expect(fmtDuration(95 * 60e3)).toBe('1 h 35 min');
  });
  it('classifies routes', () => {
    expect(classify('/companies/de-1/financials')).toEqual({ section: 'company', entityType: 'company', entityId: 'de-1' });
    expect(classify('/').section).toBe('search');
  });
});

describe('no feature gating (CMA clarification)', () => {
  it('only the auth module and the admin console compare the user role', () => {
    const offenders: string[] = [];
    const walk = (d: string) => readdirSync(d).forEach((f) => {
      const p = join(d, f);
      if (statSync(p).isDirectory()) return walk(p);
      if (!/\.(ts|tsx)$/.test(f)) return;
      const s = readFileSync(p, 'utf8');
      if (/role\s*[!=]==\s*['"](Administrator|Member)['"]|['"](Administrator|Member)['"]\s*[!=]==\s*\w*\.?role/.test(s) && !/[\\/](auth|admin)[\\/]/.test(p)) offenders.push(p);
    });
    walk('src');
    expect(offenders).toEqual([]);
  });
});
