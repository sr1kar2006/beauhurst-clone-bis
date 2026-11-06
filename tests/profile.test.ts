import { describe, expect, it } from 'vitest';
import { getProfile } from '../src/data/profile/generateProfile';
import { similarIds } from '../src/data/profile/similarity';
import { groupHoldings } from '../src/data/profile/ownership';
import { getCompanies } from '../src/data/dataset';
import { LUMEN_ID, GROUP_DEMO_ID } from '../src/data/fixtures/lumen-bank';

const lumen = getProfile(LUMEN_ID)!;

describe('Lumen Bank fixture', () => {
  it('matches the reference ballpark', () => {
    const fr = lumen.transactions.filter((t) => t.type === 'fundraising');
    expect(fr).toHaveLength(16);
    const total = fr.reduce((s, t) => s + (t.verified ?? 0), 0);
    expect(total / 1e9).toBeCloseTo(1.42, 1);
    const grants = lumen.transactions.filter((t) => t.type === 'grant');
    expect(grants).toHaveLength(2);
    expect(grants.reduce((s, t) => s + (t.verified ?? 0), 0)).toBe(5000);
    expect(lumen.people.keyPeople).toHaveLength(60);
    expect(lumen.people.directors).toHaveLength(10);
    expect(lumen.filings).toHaveLength(40);
    expect(lumen.news).toHaveLength(378);
    expect(lumen.timeline.length).toBeGreaterThanOrEqual(140);
    expect(lumen.timeline.length).toBeLessThanOrEqual(160);
    expect(lumen.patents).toHaveLength(0);
    expect(lumen.charges).toHaveLength(0);
    expect(lumen.registeredName).toBe('Lumen Bank Holding Group Limited');
  });

  it('ownership: 193,153,514 shares in 9 classes worth ~£3.28b, percentages sum to 100', () => {
    const latest = lumen.ownership.filings[lumen.ownership.filings.length - 1];
    const { groups, totalShares, totalWorth } = groupHoldings(latest, lumen.ownership.pricePerShare);
    expect(totalShares).toBe(193_153_514);
    expect(groups).toHaveLength(9);
    expect(totalWorth / 1e9).toBeCloseTo(3.28, 2);
    const pct = groups.flatMap((g) => g.rows).reduce((s, h) => s + h.totalPct, 0);
    expect(pct).toBeCloseTo(100, 6);
    groups.forEach((g) => expect(g.rows.reduce((s, h) => s + h.classPct, 0)).toBeCloseTo(100, 6));
    expect(groups[0].rows.length).toBe(267);
  });

  it('financial statements reconcile every year', () => {
    expect(lumen.financials).toHaveLength(5);
    lumen.financials.forEach(({ values: v }) => {
      const n = (k: string) => v[k] as number;
      expect(n('grossProfit')).toBe(n('turnover') - n('costOfSales'));
      expect(n('ebitda')).toBe(n('operatingProfit') + n('amortisation') + n('depreciation'));
      expect(n('preTaxProfit')).toBe(n('operatingProfit') + n('netInterest'));
      expect(n('totalLiabilities')).toBe(n('totalCurrentLiabilities') + n('totalLongTermLiabilities'));
      expect(n('netAssets')).toBe(n('totalAssets') - n('totalLiabilities'));
      expect(n('totalAssets')).toBe(n('fixedAssets') + n('totalCurrentAssets'));
      expect(n('shareholderFunds')).toBe(n('netAssets'));
      expect(n('netCashBeforeFinancing') + n('netCashFinancing')).toBe(n('increaseInCash'));
    });
    const last = lumen.financials[4].values;
    expect(last.turnover).toBe(880_000_000);
    expect(last.operatingProfit).toBe(192_000_000);
    expect(last.ebitda).toBe(199_000_000);
    expect(last.netAssets).toBe(862_000_000);
    expect(last.cash).toBe(7_620_000_000);
    // cash movement matches the balance sheet year on year
    for (let i = 1; i < 5; i++) {
      expect(lumen.financials[i].values.increaseInCash).toBe((lumen.financials[i].values.cash as number) - (lumen.financials[i - 1].values.cash as number));
    }
  });

  it('corporate tree: Lumen is the ultimate parent with one child; the group demo is deeper', () => {
    expect(lumen.corporateTree.current).toBe(true);
    expect(lumen.corporateTree.children).toHaveLength(1);
    const g = getProfile(GROUP_DEMO_ID)!;
    const count = (n: typeof g.corporateTree): number => 1 + n.children.reduce((s, c) => s + count(c), 0);
    expect(count(g.corporateTree)).toBeGreaterThanOrEqual(8);
  });
});

describe('generated profiles', () => {
  it('are deterministic and exist for every company', () => {
    const ids = getCompanies().slice(2, 40).map((c) => c.id);
    ids.forEach((id) => expect(getProfile(id)).not.toBeNull());
    const a = getProfile('c17')!;
    expect(a.people.keyPeople.map((p) => p.name)).toEqual(getProfile('c17')!.people.keyPeople.map((p) => p.name));
  });
  it('generated financials reconcile too', () => {
    const withFin = getCompanies().slice(2, 400).map((c) => getProfile(c.id)!).filter((p) => p.financials.length);
    expect(withFin.length).toBeGreaterThan(10);
    withFin.forEach((p) => p.financials.forEach(({ values: v }) => {
      expect(v.netAssets).toBe((v.totalAssets as number) - (v.totalLiabilities as number));
      expect(v.shareholderFunds).toBe(v.netAssets);
    }));
  });
  it('similar companies: 20, excluding self, deterministic', () => {
    const s = similarIds(LUMEN_ID);
    expect(s).toHaveLength(20);
    expect(s).not.toContain(LUMEN_ID);
    expect(similarIds(LUMEN_ID)).toEqual(s);
  });
  it('timeline and activity are sorted newest first', () => {
    const t = lumen.timeline.map((e) => e.date);
    expect([...t].sort().reverse()).toEqual(t);
    expect(lumen.activity[0].added).toBe('2024-11-13');
  });
});
