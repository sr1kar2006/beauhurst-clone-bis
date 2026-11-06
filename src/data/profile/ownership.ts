import type { Rng } from '../rng';
import type { Holding, OwnershipFiling } from './types';

export interface ClassSpec { name: string; holders: number; shares: number }
export interface OwnershipInput {
  classes: ClassSpec[];
  /** big holders placed first in the main class: [name, isPerson] */
  anchors: [string, boolean][];
  personName: () => string;
  companyNames: string[];
  dates: string[]; // confirmation statements, oldest first
}

/** Split `total` into `n` integer parts with a heavy-tailed distribution, sum exact. */
function split(r: Rng, total: number, n: number): number[] {
  const w = Array.from({ length: n }, (_, i) => Math.pow(r.next() * 0.9 + 0.1, 3) * (i < 3 ? 25 : 1));
  const sum = w.reduce((s, x) => s + x, 0);
  const parts = w.map((x) => Math.max(1, Math.floor((x / sum) * total)));
  parts[0] += total - parts.reduce((s, x) => s + x, 0);
  return parts.sort((a, b) => b - a);
}

/** Latest filing first-hand; older filings are derived by removing newer holders and shrinking stakes. */
export function buildOwnership(r: Rng, o: OwnershipInput): OwnershipFiling[] {
  const latest: Holding[] = [];
  let anchorIdx = 0;
  o.classes.forEach((cls, ci) => {
    const amounts = split(r, cls.shares, cls.holders);
    amounts.forEach((shares, i) => {
      let shareholder: string, isPerson: boolean;
      if (ci === 0 && anchorIdx < o.anchors.length && i < o.anchors.length) {
        [shareholder, isPerson] = o.anchors[anchorIdx++];
      } else if (r.chance(0.18)) {
        shareholder = r.pick(o.companyNames); isPerson = false;
      } else {
        shareholder = o.personName(); isPerson = true;
      }
      latest.push({ shareholder, isPerson, shareClass: cls.name, shares });
    });
  });

  const filings: OwnershipFiling[] = [];
  let cur = latest;
  for (let i = o.dates.length - 1; i >= 0; i--) {
    filings.unshift({ date: o.dates[i], holdings: cur });
    // previous year: drop ~7% of holders (they become "New") and shrink a third of stakes
    cur = cur
      .filter((_, idx) => idx < 3 || !r.chance(0.07))
      .map((h) => (r.chance(0.33) ? { ...h, shares: Math.max(1, Math.round(h.shares * (0.7 + r.next() * 0.28))) } : h));
  }
  return filings;
}

export interface ClassGroup { shareClass: string; rows: (Holding & { classPct: number; totalPct: number; worth: number })[]; total: number; worth: number }

/** Group a filing by class with derived percentages and paper worth. */
export function groupHoldings(f: OwnershipFiling, pricePerShare: number): { groups: ClassGroup[]; totalShares: number; totalWorth: number } {
  const totalShares = f.holdings.reduce((s, h) => s + h.shares, 0);
  const byClass = new Map<string, Holding[]>();
  f.holdings.forEach((h) => byClass.set(h.shareClass, [...(byClass.get(h.shareClass) ?? []), h]));
  const groups: ClassGroup[] = [...byClass].map(([shareClass, hs]) => {
    const total = hs.reduce((s, h) => s + h.shares, 0);
    return {
      shareClass,
      total,
      worth: total * pricePerShare,
      rows: hs.map((h) => ({ ...h, classPct: (h.shares / total) * 100, totalPct: (h.shares / totalShares) * 100, worth: h.shares * pricePerShare })),
    };
  });
  return { groups, totalShares, totalWorth: totalShares * pricePerShare };
}
