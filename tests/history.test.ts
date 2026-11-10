import { describe, expect, it } from 'vitest';
import { getCompanies } from '../src/data/dataset';
import { finHistory } from '../src/data/finIndex';
import { getProfile } from '../src/data/profile/generateProfile';

describe('historical depth', () => {
  const all = getCompanies();
  it('companies old enough have up to 20 years of financials; never before incorporation', () => {
    const twenty = all.filter((c) => finHistory(c).length === 20);
    console.log('TWENTY', twenty.slice(0, 3).map((c) => c.id).join(','));
    expect(twenty.length).toBeGreaterThan(20);
    for (const c of all.slice(0, 3000)) {
      const h = finHistory(c);
      if (h.length) expect(h[0].yearEnd.slice(0, 4) >= c.foundedDate.slice(0, 4)).toBe(true);
      expect(h.length).toBeLessThanOrEqual(20);
    }
  });
  it('profiles carry every year of accounts and yearly ownership filings', () => {
    const c = all.find((x) => finHistory(x).length === 20)!;
    const p = getProfile(c.id)!;
    expect(p.financials).toHaveLength(20);
    expect(p.ownership.filings.length).toBeGreaterThanOrEqual(15);
    expect(p.timeline.some((e) => e.type === 'Incorporation')).toBe(true);
  });
});
