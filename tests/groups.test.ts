import { describe, expect, it } from 'vitest';
import { getCompanies, getCompany } from '../src/data/dataset';
import { allGroupRoots, chainUp, subsidiaries, ubos, effectiveParentPct, pscRegister, parentEdge, childEdges, groupTree } from '../src/data/groups';
import { getProfile } from '../src/data/profile/generateProfile';

describe('ultimate and beneficial ownership', () => {
  getCompanies();
  const roots = allGroupRoots();
  it('builds at least 50 groups, many multi-level and cross-border', () => {
    expect(roots.length).toBeGreaterThanOrEqual(50);
    const multi = roots.filter((r) => subsidiaries(r).some((s) => !s.direct));
    expect(multi.length).toBeGreaterThan(15);
    const cross = roots.filter((r) => subsidiaries(r).some((s) => getCompany(s.companyId)!.country !== getCompany(r)!.country));
    expect(cross.length).toBeGreaterThan(20);
  });
  it('chain percentages are consistent: each edge in (0,100], effective = product, UBOs sum to at most 100%', () => {
    for (const r of roots) {
      for (const s of subsidiaries(r)) {
        const e = parentEdge(s.companyId)!;
        expect(e.pct).toBeGreaterThan(0);
        expect(e.pct).toBeLessThanOrEqual(100);
        const chain = chainUp(s.companyId);
        expect(chain[chain.length - 1].companyId).toBe(r);
        const product = chain.reduce((p, x) => (x.pctHeldByNext != null ? (p * x.pctHeldByNext) / 100 : p), 100);
        expect(effectiveParentPct(s.companyId)).toBeCloseTo(product, 9);
        expect(s.effective).toBeCloseTo(product, 9);
      }
      const owners = ubos(r);
      expect(owners.reduce((n, o) => n + o.pct, 0)).toBeLessThanOrEqual(100);
      owners.forEach((o) => expect(o.pct).toBeGreaterThan(25));
      // a company is never owned more than 100% by its direct corporate parents
      childEdges(r).forEach((e) => expect(e.pct).toBeLessThanOrEqual(100));
    }
  });
  it('showcase companies sit in groups; the tree carries % and countries', () => {
    const t = groupTree('de-1');
    const flat: { pct?: number; country: string }[] = [];
    const walk = (n: typeof t) => { flat.push(n); n.children.forEach(walk); };
    walk(t);
    expect(flat.slice(1).every((n) => n.pct != null)).toBe(true);
    expect(getProfile('de-1')!.corporateTree.children.length).toBeGreaterThan(0);
  });
  it('PSC register: corporate parent with nature of control, holders over 25%', () => {
    const c = getCompany('de-1')!;
    const reg = pscRegister(c, getProfile('de-1')!);
    const parent = reg.find((x) => x.kind === 'legal entity' && x.companyId);
    expect(parent?.natures[0]).toMatch(/^Ownership of shares: more than/);
    const lumen = pscRegister(getCompany('lumen-bank')!, getProfile('lumen-bank')!);
    expect(lumen.length).toBeGreaterThan(0);
  });
});
