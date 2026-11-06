/** Pure statistics over a result set. Each returns plain data the chart cards render. */
import type { Company, Gender } from '../data/types';
import { DATA_TODAY } from '../data/generate';
import { INDUSTRY_BY_ID } from '../data/taxonomies/industries';
import { SIGNAL_TREE } from '../data/taxonomies/signals';
import { STAGES, Stage, TRACKING, Tracking, REGIONS } from '../data/taxonomies/misc';
import { quarterLabel } from '../lib/format';

export interface Bar { label: string; value: number; id?: string }

// ---------- overview
export function trackingCounts(list: Company[]): Record<Tracking, number> {
  const out = Object.fromEntries(TRACKING.map((t) => [t, 0])) as Record<Tracking, number>;
  list.forEach((c) => out[c.trackingStatus]++);
  return out;
}

export function financialSummary(list: Company[]) {
  const withTurnover = list.filter((c) => c.turnover != null);
  const totalTurnover = withTurnover.reduce((s, c) => s + (c.turnover ?? 0), 0);
  const full = list.filter((c) => c.hasFullFinancials).length;
  const withEmp = list.filter((c) => c.employees != null);
  const totalEmployees = withEmp.reduce((s, c) => s + (c.employees ?? 0), 0);
  return {
    totalTurnover,
    averageTurnover: withTurnover.length ? totalTurnover / withTurnover.length : 0,
    fullFinancials: full,
    fullFinancialsPct: list.length ? (full / list.length) * 100 : 0,
    totalEmployees,
    averageEmployees: withEmp.length ? Math.round(totalEmployees / withEmp.length) : 0,
  };
}

// ---------- time series
type Q = { y: number; q: number };
export function quarterRange(from: Q, to: Q): Q[] {
  const out: Q[] = [];
  let { y, q } = from;
  while (y < to.y || (y === to.y && q <= to.q)) {
    out.push({ y, q });
    q++; if (q > 4) { q = 1; y++; }
  }
  return out;
}
const qKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${Math.floor(d.getUTCMonth() / 3) + 1}`;
};
const qEnd = ({ y, q }: Q) => new Date(Date.UTC(y, q * 3, 0)).toISOString().slice(0, 10);

export function foundationsAndCessations(list: Company[], from: Q = { y: 2014, q: 4 }, to: Q = { y: 2024, q: 3 }) {
  const qs = quarterRange(from, to);
  const f = new Map<string, number>(), c = new Map<string, number>();
  list.forEach((co) => {
    const k = qKey(co.foundedDate); f.set(k, (f.get(k) ?? 0) + 1);
    if (co.ceasedDate) { const kc = qKey(co.ceasedDate); c.set(kc, (c.get(kc) ?? 0) + 1); }
  });
  return qs.map((qq) => {
    const k = `${qq.y}-${qq.q}`;
    const foundations = f.get(k) ?? 0, cessations = c.get(k) ?? 0;
    return { label: quarterLabel(qq.y, qq.q), foundations, cessations, net: foundations - cessations };
  });
}

export function activeOverTime(list: Company[], from: Q = { y: 2005, q: 1 }, to: Q = { y: 2024, q: 3 }) {
  const founded = list.map((c) => c.foundedDate).sort();
  const ceased = list.map((c) => c.ceasedDate).filter(Boolean).sort() as string[];
  let fi = 0, ci = 0;
  return quarterRange(from, to).map((qq) => {
    const end = qEnd(qq);
    while (fi < founded.length && founded[fi] <= end) fi++;
    while (ci < ceased.length && ceased[ci] <= end) ci++;
    return { label: quarterLabel(qq.y, qq.q), value: fi - ci };
  });
}

// ---------- classification
export function industryRanking(list: Company[], type: 'industry' | 'buzzword'): Bar[] {
  const counts = new Map<string, number>();
  list.forEach((c) => c.industries.forEach((id) => {
    const it = INDUSTRY_BY_ID.get(id);
    if (it?.type === type) counts.set(id, (counts.get(id) ?? 0) + 1);
  }));
  return [...counts].map(([id, value]) => ({ id, label: INDUSTRY_BY_ID.get(id)!.label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function stageCounts(list: Company[]): { stage: Stage; value: number }[] {
  const m = new Map<Stage, number>(STAGES.map((s) => [s, 0]));
  list.forEach((c) => m.set(c.stage, m.get(c.stage)! + 1));
  return STAGES.map((stage) => ({ stage, value: m.get(stage)! }));
}

export function esgSignals(list: Company[]) {
  const group = (pid: string) =>
    SIGNAL_TREE.find((p) => p.id === pid)!.children!.map((s) => ({ id: s.id, label: s.label, value: list.filter((c) => c.signals.includes(s.id)).length }));
  return { environmental: group('environmental'), social: group('social') };
}

// ---------- transactions
export function topBy(list: Company[], key: 'fundraisingTotal' | 'turnover' | 'fundraisingCount', n = 10): { company: Company; value: number }[] {
  const val = (c: Company) => (key === 'fundraisingCount' ? c.fundraisings.length : (c[key] ?? 0));
  return list.filter((c) => val(c) > 0).sort((a, b) => val(b) - val(a)).slice(0, n).map((company) => ({ company, value: val(company) }));
}

// ---------- people
const GENDERS: Gender[] = ['Male', 'Female', 'Unknown'];
export function genderBreakdown(list: Company[], who: 'directors' | 'founders', when: 'current' | 'all'): Record<Gender, number> {
  const out: Record<Gender, number> = { Male: 0, Female: 0, Unknown: 0 };
  list.forEach((c) => {
    const people = who === 'founders' ? c.founders : c.directors.filter((d) => when === 'all' || !d.resigned);
    people.forEach((p) => out[p.gender]++);
  });
  return out;
}

export const BALANCE = ['All Female', 'Majority Female', 'Equal Split', 'Majority Male', 'All Male'] as const;
export type Balance = (typeof BALANCE)[number];
export function genderBalance(list: Company[], who: 'directors' | 'founders'): Record<Balance, number> {
  const out = Object.fromEntries(BALANCE.map((b) => [b, 0])) as Record<Balance, number>;
  list.forEach((c) => {
    const people = who === 'founders' ? c.founders : c.directors.filter((d) => !d.resigned);
    const m = people.filter((p) => p.gender === 'Male').length;
    const f = people.filter((p) => p.gender === 'Female').length;
    if (m + f === 0) return;
    const b: Balance = f === 0 ? 'All Male' : m === 0 ? 'All Female' : f === m ? 'Equal Split' : f > m ? 'Majority Female' : 'Majority Male';
    out[b]++;
  });
  return out;
}

export const AGE_BANDS = ['<20', '20-29', '30-39', '40-49', '50-59', '>60'] as const;
const band = (age: number) => (age < 20 ? 0 : age < 30 ? 1 : age < 40 ? 2 : age < 50 ? 3 : age < 60 ? 4 : 5);
/** % of active directors in each age band, per year 2005..last full year, then "Today". */
export function directorAgesOverTime(list: Company[], fromYear = 2005) {
  const lastYear = DATA_TODAY.getUTCFullYear() - 1;
  const points: { label: string; year: number; at: string }[] = [];
  for (let y = fromYear; y <= lastYear; y++) points.push({ label: String(y), year: y, at: `${y}-12-31` });
  points.push({ label: 'Today', year: DATA_TODAY.getUTCFullYear(), at: DATA_TODAY.toISOString().slice(0, 10) });
  const dirs = list.flatMap((c) => c.directors);
  return points.map((p) => {
    const counts = [0, 0, 0, 0, 0, 0];
    dirs.forEach((d) => {
      if (d.appointed <= p.at && (!d.resigned || d.resigned > p.at)) counts[band(p.year - d.birthYear)]++;
    });
    const total = counts.reduce((s, x) => s + x, 0) || 1;
    return { label: p.label, pct: counts.map((x) => (x / total) * 100) };
  });
}

// ---------- fundraisings tab
export function fundraisingsByQuarter(list: Company[], from: Q = { y: 2014, q: 4 }, to: Q = { y: 2024, q: 3 }) {
  const deals = new Map<string, number>(), amount = new Map<string, number>();
  list.forEach((c) => c.fundraisings.forEach((f) => {
    const k = qKey(f.date);
    deals.set(k, (deals.get(k) ?? 0) + 1);
    amount.set(k, (amount.get(k) ?? 0) + f.amount);
  }));
  return quarterRange(from, to).map((qq) => {
    const k = `${qq.y}-${qq.q}`;
    return { label: quarterLabel(qq.y, qq.q), deals: deals.get(k) ?? 0, amount: amount.get(k) ?? 0 };
  });
}

export function topInvestors(list: Company[], n = 10): Bar[] {
  const m = new Map<string, number>();
  list.forEach((c) => c.fundraisings.forEach((f) => f.investors.forEach((i) => m.set(i, (m.get(i) ?? 0) + 1))));
  return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, n);
}

export function dealStages(list: Company[]): Bar[] {
  const m = new Map<string, number>([['Seed', 0], ['Venture', 0], ['Growth', 0]]);
  list.forEach((c) => c.fundraisings.forEach((f) => m.set(f.stage, m.get(f.stage)! + 1)));
  return [...m].map(([label, value]) => ({ label, value }));
}

// ---------- MBO tab
const isMbo = (c: Company) => c.signals.includes('growth:mbo-mbi') || c.events.some((e) => e.type === 'Management buyout');
export function mboCompanies(list: Company[]) { return list.filter(isMbo); }
export function mbosByYear(list: Company[], from = 2010, to = 2024) {
  const m = new Map<number, number>();
  mboCompanies(list).forEach((c) => {
    const ev = c.events.find((e) => e.type === 'Management buyout');
    const y = new Date(ev?.date ?? c.latestFundraisingDate ?? c.foundedDate).getUTCFullYear();
    m.set(y, (m.get(y) ?? 0) + 1);
  });
  const out: Bar[] = [];
  for (let y = from; y <= to; y++) out.push({ label: String(y), value: m.get(y) ?? 0 });
  return out;
}
export function byRegion(list: Company[]): Bar[] {
  return REGIONS.map((r) => ({ label: r, value: list.filter((c) => c.headOffice === r).length })).filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
}
