import { create } from 'zustand';
import type { Query } from '../criteria/types';
import type { Company } from '../data/types';
import { load, save } from '../lib/storage';
import { getCompanies, getCompany } from '../data/dataset';
import { run } from '../query/run';
import { useResults } from '../store/resultsStore';
import { useSaved } from '../store/savedStore';
import { useCollections } from '../store/collectionsStore';
import { useCompare } from '../store/compareStore';
import { USER_NAME } from '../config';

export type ScopeKind = 'search' | 'saved-search' | 'collection' | 'comparison' | 'companies';
export interface Scope { kind: ScopeKind; ref?: string; ids?: string[]; query?: Query }

export type Block =
  | { id: string; kind: 'table'; title: string; fields: string[]; limit: number }
  | { id: string; kind: 'calc'; title: string; metrics: { label: string; formula: string }[] }
  | { id: string; kind: 'chart'; title: string; chartType: 'bar' | 'line' | 'donut'; field: string; groupBy: string; agg: 'count' | 'sum' | 'avg' | 'median' }
  | { id: string; kind: 'stat'; title: string; stat: 'by-country' | 'by-stage' | 'top-raised' | 'founded-by-year' }
  | { id: string; kind: 'summaries'; title: string; limit: number }
  | { id: string; kind: 'text'; title: string; body: string }
  | { id: string; kind: 'sources'; title: string };
export type BlockKind = Block['kind'];

export interface Report {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  logo: boolean;
  cover: boolean;
  orientation: 'portrait' | 'landscape';
  scope: Scope;
  blocks: Block[];
  isTemplate: boolean;
  created: string;
  lastRun?: string;
  lastRunCount?: number;
}

let seq = 0;
export const blockId = () => `b${Date.now().toString(36)}${(seq++).toString(36)}`;

export const NEW_BLOCK: Record<BlockKind, () => Block> = {
  table: () => ({ id: blockId(), kind: 'table', title: 'Companies', fields: ['name', 'country', 'stage', 'turnover', 'employees'], limit: 25 }),
  calc: () => ({ id: blockId(), kind: 'calc', title: 'Key metrics', metrics: [{ label: 'Companies', formula: 'COUNT(fundraisings)' }, { label: 'Median turnover', formula: 'MEDIAN(turnover)' }, { label: 'Total raised', formula: 'SUM(fundraisingTotal)' }] }),
  chart: () => ({ id: blockId(), kind: 'chart', title: 'Companies by country', chartType: 'bar', field: 'turnover', groupBy: 'country', agg: 'count' }),
  stat: () => ({ id: blockId(), kind: 'stat', title: 'Stage of evolution', stat: 'by-stage' }),
  summaries: () => ({ id: blockId(), kind: 'summaries', title: 'Company profiles', limit: 5 }),
  text: () => ({ id: blockId(), kind: 'text', title: 'Commentary', body: 'Add your commentary here.' }),
  sources: () => ({ id: blockId(), kind: 'sources', title: 'Sources' }),
};
export const BLOCK_LABEL: Record<BlockKind, string> = {
  table: 'Company table', calc: 'Calculated metrics', chart: 'Chart', stat: 'Statistics card', summaries: 'Company profile summaries', text: 'Text block', sources: 'Sources appendix',
};

const today = () => new Date().toISOString().slice(0, 10);

export function newReport(scope?: Scope): Report {
  return {
    id: `rep-${Date.now().toString(36)}`, title: 'Untitled report', subtitle: '', author: USER_NAME, date: today(), logo: true, cover: true, orientation: 'portrait',
    scope: scope ?? { kind: 'search' }, blocks: [NEW_BLOCK.calc(), NEW_BLOCK.chart(), NEW_BLOCK.table(), NEW_BLOCK.sources()], isTemplate: false, created: today(),
  };
}

const SEED: Report[] = [{
  id: 'rep-demo', title: 'UK & Ireland AI scale-ups', subtitle: 'Active AI companies with equity fundraising, sample market scan', author: 'Simone', date: '2024-11-12',
  logo: true, cover: true, orientation: 'portrait', isTemplate: false, created: '2024-11-12', lastRun: '2024-11-12T09:30:00Z', lastRunCount: 0,
  scope: { kind: 'saved-search', query: { entity: 'companies', countries: ['GB', 'IE'], combinator: 'all', criteria: [{ uid: 'd1', defId: 'industries', op: 'any', value: ['artificial-intelligence'] }, { uid: 'd2', defId: 'ch-status', op: 'is', value: ['Active'] }, { uid: 'd3', defId: 'signals', op: 'any', value: ['growth:equity-fundraising'] }] } },
  blocks: [
    { id: 'b1', kind: 'text', title: 'Summary', body: 'This sample report scans active AI companies in the UK and Ireland that have raised equity. All figures are generated sample data.' },
    { id: 'b2', kind: 'calc', title: 'Key metrics', metrics: [{ label: 'Companies', formula: 'COUNT(fundraisings)' }, { label: 'Total raised', formula: 'SUM(fundraisingTotal)' }, { label: 'Median employees', formula: 'MEDIAN(employees)' }, { label: 'Turnover per employee (median co.)', formula: 'MEDIAN(turnover) / MEDIAN(employees)' }] },
    { id: 'b3', kind: 'chart', title: 'Companies by country', chartType: 'bar', field: 'turnover', groupBy: 'country', agg: 'count' },
    { id: 'b4', kind: 'stat', title: 'Stage of evolution', stat: 'by-stage' },
    { id: 'b5', kind: 'table', title: 'Largest by total raised', fields: ['name', 'country', 'stage', 'fundraisingTotal', 'employees'], limit: 15 },
    { id: 'b6', kind: 'summaries', title: 'Company profiles', limit: 3 },
    { id: 'b7', kind: 'sources', title: 'Sources' },
  ],
}, {
  id: 'rep-tpl-cmp', title: 'Peer comparison pack (template)', subtitle: 'Compare a peer group across countries', author: 'Simone', date: '2024-10-01',
  logo: true, cover: true, orientation: 'landscape', isTemplate: true, created: '2024-10-01',
  scope: { kind: 'comparison', ref: 'cmp-demo' },
  blocks: [
    { id: 't1', kind: 'table', title: 'Peer group', fields: ['name', 'country', 'listed', 'turnover', 'operatingProfit', 'employees', 'turnoverGrowth1y'], limit: 10 },
    { id: 't2', kind: 'chart', title: 'Turnover by company', chartType: 'bar', field: 'turnover', groupBy: 'name', agg: 'sum' },
    { id: 't3', kind: 'sources', title: 'Sources' },
  ],
}];

const KEY = 'nb.reports';

interface State {
  reports: Report[];
  upsert: (r: Report) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Report | undefined;
  markRun: (id: string, count: number) => void;
}
export const useReports = create<State>((set, get) => {
  const persist = (reports: Report[]) => { save(KEY, reports); set({ reports }); };
  return {
    reports: load<Report[]>(KEY, SEED),
    upsert: (r) => { const rs = get().reports; persist(rs.some((x) => x.id === r.id) ? rs.map((x) => (x.id === r.id ? r : x)) : [r, ...rs]); },
    remove: (id) => persist(get().reports.filter((r) => r.id !== id)),
    duplicate: (id) => {
      const r = get().reports.find((x) => x.id === id);
      if (!r) return undefined;
      const copy = { ...structuredClone(r), id: `rep-${Date.now().toString(36)}`, title: `${r.title} (copy)`, isTemplate: false, created: today(), lastRun: undefined };
      persist([copy, ...get().reports]);
      return copy;
    },
    markRun: (id, count) => persist(get().reports.map((r) => (r.id === id ? { ...r, lastRun: new Date().toISOString(), lastRunCount: count } : r))),
  };
});

/** Resolve a report scope to companies using current data (so "Run again" reflects the latest data). */
export function resolveScope(s: Scope): Company[] {
  const all = getCompanies();
  const byIds = (ids: string[]) => ids.map(getCompany).filter((c): c is Company => !!c);
  switch (s.kind) {
    case 'search': { const q = s.query ?? useResults.getState().ranQuery; return q ? run(q, all) : []; }
    case 'saved-search': { const q = s.query ?? useSaved.getState().saved.find((x) => x.id === s.ref)?.query; return q ? run(q, all) : []; }
    case 'collection': return byIds(useCollections.getState().collections.find((c) => c.id === s.ref)?.companyIds ?? []);
    case 'comparison': return byIds(useCompare.getState().saved.find((c) => c.id === s.ref)?.ids ?? s.ids ?? []);
    case 'companies': return byIds(s.ids ?? []);
  }
}

export function scopeLabel(s: Scope): string {
  switch (s.kind) {
    case 'search': return 'Current search';
    case 'saved-search': return `Saved search: ${useSaved.getState().saved.find((x) => x.id === s.ref)?.name ?? (s.query ? 'embedded query' : 'missing')}`;
    case 'collection': return `Collection: ${useCollections.getState().collections.find((c) => c.id === s.ref)?.name ?? 'missing'}`;
    case 'comparison': return `Comparison: ${useCompare.getState().saved.find((c) => c.id === s.ref)?.name ?? 'missing'}`;
    case 'companies': return `${s.ids?.length ?? 0} hand-picked companies`;
  }
}
