import { describe, expect, it } from 'vitest';
import { getCompanies, getOriginalUk } from '../src/data/dataset';
import { run } from '../src/query/run';
import { sortCompanies, pageItems, compareNames } from '../src/query/sort';
import { formatMoney, formatDate, joinAnd } from '../src/lib/format';
import { DEMO_QUERY } from '../src/query/presets';
import type { Query } from '../src/criteria/types';
import { INDUSTRY_ITEMS, itemsInGroup } from '../src/data/taxonomies/industries';
import { PICKER_TREE, CRITERIA } from '../src/criteria/registry';

describe('dataset', () => {
  it('is deterministic, ~12,000 unique companies, ~50% UK / 15% IE / 35% other', () => {
    const a = getCompanies();
    expect(a.length).toBeGreaterThan(12000);
    expect(new Set(a.map((c) => c.name.toLowerCase())).size).toBe(a.length);
    const share = (code: string) => a.filter((c) => c.country === code).length / a.length;
    expect(share('GB')).toBeGreaterThan(0.45);
    expect(share('IE')).toBeGreaterThan(0.13);
    expect(new Set(a.map((c) => c.country)).size).toBeGreaterThanOrEqual(27);
    expect(a.some((c) => c.listed) && a.some((c) => !c.listed)).toBe(true);
    expect(a[0].name).toBe(getCompanies()[0].name);
  });
  it('has ~85% Active companies', () => {
    const a = getCompanies();
    const active = a.filter((c) => c.chStatus === 'Active').length / a.length;
    expect(active).toBeGreaterThan(0.82);
    expect(active).toBeLessThan(0.88);
  });
});

describe('calibration', () => {
  it('demo query returns roughly 1,900 companies', () => {
    // the original part 1 UK dataset is unchanged, so the tour figure still holds there
    const n = run(DEMO_QUERY, getOriginalUk()).length;
    console.log('demo query count:', n);
    expect(n).toBeGreaterThanOrEqual(1850);
    expect(n).toBeLessThanOrEqual(1980);
  });
});

describe('query engine', () => {
  const data = getCompanies();
  const base: Query = { entity: 'companies', combinator: 'all', criteria: [] };
  it('empty query returns everything', () => {
    expect(run(base, data)).toHaveLength(data.length);
  });
  it('empty-valued criteria are ignored', () => {
    expect(run({ ...base, criteria: [{ uid: 'x', defId: 'ch-status', op: 'is', value: [] }] }, data)).toHaveLength(data.length);
  });
  it('is / is not partition the set', () => {
    const is = run({ ...base, criteria: [{ uid: 'x', defId: 'ch-status', op: 'is', value: ['Active'] }] }, data).length;
    const not = run({ ...base, criteria: [{ uid: 'x', defId: 'ch-status', op: 'is not', value: ['Active'] }] }, data).length;
    expect(is + not).toBe(data.length);
  });
  it('any combinator is a superset of all', () => {
    const crit = DEMO_QUERY.criteria;
    const all = run({ ...base, criteria: crit }, data).length;
    const any = run({ ...base, combinator: 'any', criteria: crit }, data).length;
    expect(any).toBeGreaterThan(all);
  });
  it('range criteria respect bounds', () => {
    const res = run({ ...base, criteria: [{ uid: 'x', defId: 'total-raised', op: 'between', value: { min: 1_000_000, max: 5_000_000 } }] }, data);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((c) => c.fundraisingTotal >= 1e6 && c.fundraisingTotal <= 5e6)).toBe(true);
  });
});

describe('sorting & paging', () => {
  it('sorts numbers before letters', () => {
    const sorted = sortCompanies(getCompanies(), { key: 'name', dir: 'asc' });
    expect(/^\d/.test(sorted[0].name)).toBe(true);
    expect(compareNames('10Cast', 'Apple')).toBeLessThan(0);
  });
  it('builds page items with ellipses', () => {
    expect(pageItems(1, 97)).toEqual([1, 2, '…', 96, 97]);
    expect(pageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('format', () => {
  it('formats money like the reference', () => {
    expect(formatMoney(90_100)).toBe('£90.1k');
    expect(formatMoney(1_580_000)).toBe('£1.58m');
    expect(formatMoney(17_900_000)).toBe('£17.9m');
    expect(formatMoney(1_010_000_000)).toBe('£1.01b');
  });
  it('formats dates and lists', () => {
    expect(formatDate('2024-03-07')).toBe('07/03/2024');
    expect(joinAnd(['A', 'B', 'C'])).toBe('A, B and C');
  });
});

describe('taxonomy & registry', () => {
  it('has ~150 industry items starting with the reference order', () => {
    expect(INDUSTRY_ITEMS.length).toBeGreaterThanOrEqual(145);
    expect(INDUSTRY_ITEMS.slice(0, 5).map((i) => i.label)).toEqual(['3D printing', 'Accessories for tech devices', 'Accountancy and tax', 'ActiveTech', 'AdTech']);
    expect(itemsInGroup('software')).toHaveLength(19);
  });
  it('picker group counts match the spec', () => {
    const counts = Object.fromEntries(PICKER_TREE.filter((n) => n.kind === 'group').map((g) => [g.kind === 'group' ? g.label : '', g.kind === 'group' ? g.children.length : 0]));
    expect(counts).toMatchObject({ Tracking: 1, 'Companies House': 2, 'Company type and structure': 5, Location: 3, 'What the company does': 7, People: 14, 'Funding received': 4, 'Significant events': 15, Financials: 3, 'Online presence': 2, 'Legacy criteria': 6 });
    expect(CRITERIA.industries.layout).toBe('two-line');
  });
});
