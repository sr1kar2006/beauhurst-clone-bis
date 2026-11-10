import { describe, expect, it } from 'vitest';
import { getCompanies } from '../src/data/dataset';
import { run } from '../src/query/run';
import { CRITERIA, PICKER_TREE } from '../src/criteria/registry';
import { RISK_DEFS } from '../src/criteria/risk';
import { riskOf } from '../src/data/riskIndex';
import { finValue, finGrowth } from '../src/data/finIndex';
import { parentEdge } from '../src/data/groups';
import type { CriterionValue, PickerNode, Query } from '../src/criteria/types';

const all = getCompanies();
const sample = all.filter((_, i) => i % 8 === 0); // keep the suite fast
const base: Query = { entity: 'companies', combinator: 'all', criteria: [] };
const q = (defId: string, op: string, value: CriterionValue) => run({ ...base, criteria: [{ uid: defId + op + JSON.stringify(value), defId, op, value }] }, sample);
const ids = (n: PickerNode[]): string[] => n.flatMap((x) => (x.kind === 'criterion' ? [x.id] : ids(x.children)));

describe('risk and financial criteria', () => {
  it('every new criterion is registered and appears in the picker', () => {
    const inTree = new Set(ids(PICKER_TREE));
    for (const d of RISK_DEFS) { expect(CRITERIA[d.id]).toBeDefined(); expect(inTree.has(d.id), d.id).toBe(true); }
    expect(RISK_DEFS.length).toBeGreaterThanOrEqual(25);
  });
  it('credit band / limit / score', () => {
    const a = q('credit-band', 'is', ['A']);
    expect(a.length).toBeGreaterThan(0);
    expect(a.every((c) => riskOf(c).band === 'A')).toBe(true);
    expect(q('credit-limit', 'between', { min: 50_000 }).every((c) => riskOf(c).creditLimit >= 50_000)).toBe(true);
    expect(q('risk-score', 'between', { max: 20 }).every((c) => riskOf(c).score <= 20)).toBe(true);
  });
  it('insolvency status and date, CCJs, late filing', () => {
    const liq = q('insolvency-status', 'is', ['Liquidation']);
    expect(liq.length).toBeGreaterThan(0);
    expect(liq.every((c) => c.chStatus === 'In Liquidation')).toBe(true);
    expect(q('insolvency-date', 'between', { from: '2019-01-01', to: '2024-12-31' }).every((c) => !!riskOf(c).insolvency)).toBe(true);
    expect(q('ccj-count', 'between', { min: 1 }).every((c) => riskOf(c).ccjCount >= 1)).toBe(true);
    expect(q('ccj-amount', 'between', { min: 10_000 }).every((c) => riskOf(c).ccjAmount >= 10_000)).toBe(true);
    expect(q('late-filing', 'yes', null).every((c) => c.signals.includes('risk:late-filing'))).toBe(true);
  });
  it('ownership: ultimate parent name / country, in group, PSC name', () => {
    const sub = q('in-group', 'yes', null);
    expect(sub.some((c) => parentEdge(c.id))).toBe(true);
    const withParent = run({ ...base, criteria: [{ uid: 'x', defId: 'ultimate-parent-country', op: 'is', value: ['GB', 'IE', 'US', 'DE', 'FR', 'NL', 'SE', 'JP', 'AU', 'CA', 'IN'] }] }, all);
    expect(withParent.length).toBeGreaterThan(5);
    expect(withParent.every((c) => parentEdge(c.id))).toBe(true);
    expect(run({ ...base, criteria: [{ uid: 'p', defId: 'ultimate-parent', op: 'contains', value: 'a' }] }, all).every((c) => parentEdge(c.id))).toBe(true);
    expect(run({ ...base, criteria: [{ uid: 'p', defId: 'psc-name', op: 'contains', value: 'a' }] }, all.slice(0, 300)).length).toBeGreaterThan(0);
  });
  it('people: current director, appointed / resigned between', () => {
    const name = sample[3].directors.find((d) => !d.resigned)!.name.split(' ')[1];
    expect(q('current-director', 'contains', name).every((c) => c.directors.some((d) => !d.resigned && d.name.includes(name)))).toBe(true);
    expect(q('director-resigned', 'between', { from: '2020-01-01', to: '2022-12-31' }).every((c) => c.directors.some((d) => d.resigned && d.resigned >= '2020-01-01' && d.resigned <= '2022-12-31'))).toBe(true);
    expect(q('director-appointed', 'between', { from: '2023-01-01' }).length).toBeGreaterThan(0);
  });
  it('financials with a year selector, and growth', () => {
    const latest = q('fin-turnover', 'between', { min: 10_000_000 });
    expect(latest.every((c) => (finValue(c, 'turnover') ?? 0) >= 10_000_000)).toBe(true);
    const y2020 = q('fin-turnover', 'between', { min: 1_000_000, year: 2020 });
    expect(y2020.length).toBeGreaterThan(0);
    expect(y2020.every((c) => (finValue(c, 'turnover', 2020) ?? 0) >= 1_000_000)).toBe(true);
    for (const id of ['fin-operating-profit', 'fin-pretax-profit', 'fin-net-assets', 'fin-total-assets', 'fin-employees']) expect(q(id, 'between', { min: 1 }).length, id).toBeGreaterThan(0);
    expect(q('growth-3y', 'between', { min: 50 }).every((c) => (finGrowth(c, 'turnover', 3) ?? 0) >= 50)).toBe(true);
    expect(q('growth-1y', 'between', { max: 0 }).length).toBeGreaterThan(0);
  });
  it('filing dates and overdue accounts', () => {
    expect(q('accounts-filed', 'between', { from: '2024-01-01' }).every((c) => (riskOf(c).accountsFiled ?? '') >= '2024-01-01')).toBe(true);
    expect(q('confirmation-filed', 'between', { from: '2024-06-01' }).length).toBeGreaterThan(0);
    expect(q('accounts-overdue', 'yes', null).every((c) => riskOf(c).accountsOverdue)).toBe(true);
    expect(q('next-accounts-due', 'between', { to: '2025-01-31' }).every((c) => riskOf(c).nextAccountsDue <= '2025-01-31')).toBe(true);
  });
});
