/**
 * Ultimate and beneficial ownership (spec 4.1). Builds ~60 multi-level, cross-border groups from the dataset:
 * ultimate parent → (intermediate holding) → subsidiaries, with % held on every edge, plus the individuals who
 * ultimately own the top company (UBOs). PSC registers are derived from these edges, from shareholdings over 25%
 * and from the persons table. Deterministic and fictional.
 */
import type { Company } from './types';
import type { CompanyProfile, CorpNode, OwnershipFiling } from './profile/types';
import { Rng } from './rng';
import { getCompanies, getCompany } from './dataset';
import { getPersons, personIdFor, type Person } from './persons';

export interface Edge { parentId: string; childId: string; pct: number; since: string }
export interface Ubo { personId: string; name: string; pct: number }
export interface Psc { name: string; kind: 'individual' | 'legal entity'; personId?: string; companyId?: string; country: string; natures: string[]; notified: string; ceased?: string; pct?: number }

let built = false;
const parentOf = new Map<string, Edge>();
const childrenOf = new Map<string, Edge[]>();
const ubosOf = new Map<string, Ubo[]>();
const groupRoots: string[] = [];

const later = (a: string, b: string) => (a > b ? a : b);

function build() {
  if (built) return;
  built = true;
  const all = getCompanies();
  const r = new Rng(4141);
  const used = new Set<string>(['lumen-bank', 'harrowmere-group']);
  const pick = (pred: (c: Company) => boolean): Company | undefined => {
    for (let k = 0; k < 400; k++) { const c = all[r.int(2, all.length - 1)]; if (!used.has(c.id) && pred(c)) { used.add(c.id); return c; } }
    return undefined;
  };
  const link = (parent: Company, child: Company, pct: number) => {
    const e: Edge = { parentId: parent.id, childId: child.id, pct, since: later(parent.foundedDate, child.foundedDate) };
    parentOf.set(child.id, e);
    childrenOf.set(parent.id, [...(childrenOf.get(parent.id) ?? []), e]);
  };
  const persons = getPersons();
  const showcase = ['gb-1', 'ie-1', 'de-1', 'us-1', 'fr-1'];
  for (let g = 0; g < 60; g++) {
    // the first groups are built around the showcase companies so the demo has deep chains
    const root = pick((c) => c.listed || (c.employees ?? 0) > 150);
    if (!root) break;
    groupRoots.push(root.id);
    const levels = r.chance(0.7) ? 2 : 1;
    let holding = root;
    if (levels === 2) {
      const mid = pick((c) => c.country !== root.country || r.chance(0.3));
      if (mid) { link(root, mid, r.chance(0.6) ? 100 : r.int(60, 99)); holding = mid; }
    }
    const nSubs = r.int(1, 4);
    for (let s = 0; s < nSubs; s++) {
      const target = s === 0 && g < showcase.length ? getCompany(showcase[g]) : undefined;
      const sub = target && !used.has(target.id) ? (used.add(target.id), target) : pick(() => true);
      if (sub) link(r.chance(0.75) ? holding : root, sub, r.chance(0.5) ? 100 : r.int(51, 95));
    }
    // UBOs of the ultimate parent: individuals with more than 25% (listed parents are often widely held)
    if (!root.listed || r.chance(0.3)) {
      const n = root.listed ? 1 : r.int(1, 2);
      let left = 100;
      const owners: Ubo[] = [];
      for (let k = 0; k < n; k++) {
        const p = persons[r.int(0, persons.length - 1)];
        const pct = Math.min(left - 1, root.listed ? r.int(26, 35) : r.int(26, 60));
        if (pct <= 25) break;
        left -= pct;
        owners.push({ personId: p.id, name: p.name, pct });
      }
      ubosOf.set(root.id, owners);
    }
  }
}

export function parentEdge(id: string) { build(); return parentOf.get(id); }
export function childEdges(id: string) { build(); return childrenOf.get(id) ?? []; }
export function isGroupMember(id: string) { build(); return parentOf.has(id) || childrenOf.has(id); }
export function allGroupRoots() { build(); return groupRoots; }

/** [this company, parent, …, ultimate parent] with the % each holds in the one before. */
export function chainUp(id: string): { companyId: string; pctHeldByNext?: number }[] {
  build();
  const out: { companyId: string; pctHeldByNext?: number }[] = [{ companyId: id }];
  let e = parentOf.get(id);
  const seen = new Set([id]);
  while (e && !seen.has(e.parentId)) {
    out[out.length - 1].pctHeldByNext = e.pct;
    out.push({ companyId: e.parentId });
    seen.add(e.parentId);
    e = parentOf.get(e.parentId);
  }
  return out;
}
export const ultimateParentId = (id: string) => { const ch = chainUp(id); return ch[ch.length - 1].companyId; };
export function ubos(rootId: string): Ubo[] { build(); return ubosOf.get(rootId) ?? []; }

/** Effective % of `id` owned by its ultimate parent (product of the chain). */
export function effectiveParentPct(id: string): number {
  return chainUp(id).reduce((p, x) => (x.pctHeldByNext != null ? (p * x.pctHeldByNext) / 100 : p), 100);
}

/** Direct and indirect subsidiaries with effective %. */
export function subsidiaries(id: string): { companyId: string; direct: boolean; pct: number; effective: number; parentId: string }[] {
  build();
  const out: { companyId: string; direct: boolean; pct: number; effective: number; parentId: string }[] = [];
  const walk = (pid: string, eff: number, depth: number) => {
    for (const e of childrenOf.get(pid) ?? []) {
      const ef = (eff * e.pct) / 100;
      out.push({ companyId: e.childId, direct: depth === 0, pct: e.pct, effective: ef, parentId: pid });
      walk(e.childId, ef, depth + 1);
    }
  };
  walk(id, 100, 0);
  return out;
}

/** Corporate tree for a group member, with % on each edge and the members' countries. */
export function groupTree(id: string): CorpNode {
  const rootId = ultimateParentId(id);
  const node = (cid: string, pct?: number): CorpNode => {
    const c = getCompany(cid)!;
    return { id: `g-${cid}`, name: c.name, registeredName: c.name, country: c.country, consolidated: (childrenOf.get(cid) ?? []).length > 0, companyId: cid, current: cid === id, pct, children: (childrenOf.get(cid) ?? []).map((e) => node(e.childId, e.pct)) };
  };
  return node(rootId);
}

export function natureFor(pct: number): string[] {
  const band = pct > 75 ? 'more than 75%' : pct > 50 ? 'more than 50% but not more than 75%' : 'more than 25% but not more than 50%';
  const out = [`Ownership of shares: ${band}`, `Voting rights: ${band}`];
  if (pct > 50) out.push('Right to appoint and remove directors');
  return out;
}

const totalShares = (f: OwnershipFiling) => f.holdings.reduce((s, h) => s + h.shares, 0);
const byHolder = (f: OwnershipFiling) => { const m = new Map<string, { shares: number; isPerson: boolean }>(); f.holdings.forEach((h) => { const x = m.get(h.shareholder) ?? { shares: 0, isPerson: h.isPerson }; x.shares += h.shares; m.set(h.shareholder, x); }); return m; };

/** PSC / beneficial owners register: parent company, holders over 25% (current and ceased), persons-table PSC interests. */
export function pscRegister(c: Company, p: CompanyProfile): Psc[] {
  build();
  const out: Psc[] = [];
  const e = parentOf.get(c.id);
  if (e) { const pc = getCompany(e.parentId)!; out.push({ name: pc.name, kind: 'legal entity', companyId: pc.id, country: pc.country, natures: natureFor(e.pct), notified: e.since, pct: e.pct }); }
  if (!e && ubosOf.has(c.id)) ubosOf.get(c.id)!.forEach((u) => out.push({ name: u.name, kind: 'individual', personId: u.personId, country: getPersonCountry(u.personId) ?? c.country, natures: natureFor(u.pct), notified: c.foundedDate, pct: u.pct }));
  const filings = p.ownership.filings;
  if (filings.length) {
    const last = filings[filings.length - 1];
    const seen = new Map<string, { first: string; lastDate: string; pct: number; isPerson: boolean }>();
    for (const f of filings) {
      const tot = totalShares(f);
      byHolder(f).forEach((v, k) => { const pct = (v.shares / tot) * 100; if (pct > 25) { const s = seen.get(k); seen.set(k, { first: s?.first ?? f.date, lastDate: f.date, pct, isPerson: v.isPerson }); } });
    }
    seen.forEach((v, name) => {
      if (out.some((x) => x.name === name)) return;
      out.push({ name, kind: v.isPerson ? 'individual' : 'legal entity', personId: v.isPerson ? personIdFor(c.id, name) : undefined, country: c.country, natures: natureFor(v.pct), notified: v.first, ceased: v.lastDate < last.date ? v.lastDate : undefined, pct: Math.round(v.pct * 10) / 10 });
    });
  }
  for (const per of getPersons()) {
    if (per.positions.some((x) => x.kind === 'PSC' && x.companyId === c.id) && !out.some((x) => x.personId === per.id)) {
      const pos = per.positions.find((x) => x.kind === 'PSC' && x.companyId === c.id)!;
      const pct = Number(/\((\d+)%\)/.exec(pos.detail)?.[1] ?? 30);
      out.push({ name: per.name, kind: 'individual', personId: per.id, country: per.country, natures: natureFor(pct), notified: pos.since, pct });
    }
  }
  if (!out.length && c.id === 'lumen-bank') {
    // Lumen Bank: founder-led, no holder over 25%; founders exercise significant influence (sample)
    c.founders.slice(0, 2).forEach((f) => out.push({ name: f.name, kind: 'individual', personId: personIdFor(c.id, f.name), country: 'GB', natures: ['Significant influence or control'], notified: '2016-04-06' }));
  }
  return out;
}

function getPersonCountry(id: string): string | undefined { return (getPersons().find((x: Person) => x.id === id) ?? null)?.country; }
