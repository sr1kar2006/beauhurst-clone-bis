import { describe, expect, it } from 'vitest';
import { getCompanies } from '../src/data/dataset';
import { run } from '../src/query/run';
import { DEMO_QUERY } from '../src/query/presets';
import * as S from '../src/stats/compute';

const demo = run(DEMO_QUERY, getCompanies());

describe('stats engine', () => {
  it('tracking counts sum to the result size', () => {
    const t = S.trackingCounts(demo);
    expect(Object.values(t).reduce((a, b) => a + b, 0)).toBe(demo.length);
  });
  it('stage counts sum to the result size and Seed is the largest', () => {
    const s = S.stageCounts(demo);
    expect(s.reduce((a, b) => a + b.value, 0)).toBe(demo.length);
    expect(s[0].stage).toBe('Seed');
    expect(Math.max(...s.map((x) => x.value))).toBe(s[0].value);
  });
  it('financial summary is consistent', () => {
    const f = S.financialSummary(demo);
    expect(f.fullFinancialsPct).toBeGreaterThan(5);
    expect(f.fullFinancialsPct).toBeLessThan(15);
    expect(f.averageEmployees).toBeGreaterThan(0);
  });
  it('quarter range covers Q4 2014 to Q3 2024', () => {
    const fc = S.foundationsAndCessations(demo);
    expect(fc[0].label).toBe('Q4 - 2014');
    expect(fc[fc.length - 1].label).toBe('Q3 - 2024');
    expect(fc).toHaveLength(40);
    expect(fc.every((x) => x.net === x.foundations - x.cessations)).toBe(true);
  });
  it('active companies grow over time', () => {
    const a = S.activeOverTime(demo);
    expect(a[0].label).toBe('Q1 - 2005');
    expect(a[a.length - 1].value).toBeGreaterThan(a[0].value);
  });
  it('industry ranking puts Application software first among industries', () => {
    const r = S.industryRanking(demo, 'industry');
    expect(r[0].label).toBe('Application software');
    expect(r[0].value / demo.length).toBeGreaterThan(0.75);
  });
  it('age distribution sums to 100% each year', () => {
    const a = S.directorAgesOverTime(demo);
    expect(a[a.length - 1].label).toBe('Today');
    a.forEach((p) => expect(Math.round(p.pct.reduce((s, x) => s + x, 0))).toBe(100));
  });
  it('directors are mostly male', () => {
    const g = S.genderBreakdown(demo, 'directors', 'current');
    expect(g.Male).toBeGreaterThan(g.Female * 2);
  });
  it('top 10 by amount raised is sorted', () => {
    const t = S.topBy(demo, 'fundraisingTotal');
    expect(t).toHaveLength(10);
    t.slice(1).forEach((x, i) => expect(x.value).toBeLessThanOrEqual(t[i].value));
  });
});
