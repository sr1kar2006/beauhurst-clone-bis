import { create } from 'zustand';
import { load, save } from '../lib/storage';

export interface Collection { id: string; name: string; companyIds: string[]; created: string; owner?: string; tag?: boolean }

const KEY = 'nb.collections';

const DEMO_NAMES: [string, string][] = [
  ['Challenger banks to watch', 'EB'], ['Fintech pipeline 2024', 'SM'], ['UK scaleups over £100m raised', 'EB'], ['Banking partners shortlist', 'JT'],
  ['Q4 investor intros', 'SM'], ['Competitor set: digital banks', 'RK'], ['London fintech map', 'EB'], ['ESG-positive financials', 'AL'],
  ['Payments ecosystem', 'JT'], ['Series D and later', 'RK'], ['Board candidates sourcing', 'AL'], ['Mobile-first brands', 'SM'],
  ['Customer case studies', 'EB'], ['Conference speakers 2025', 'JT'], ['Strategic partnerships', 'RK'], ['High growth list alumni', 'AL'],
  ['Lending market overview', 'EB'], ['Unicorn tracker', 'SM'], ['Diligence: open banking', 'RK'],
];

const DEFAULTS: Collection[] = [
  { id: 'col-watchlist', name: 'My watchlist', companyIds: ['c1', 'c2', 'c3', 'c10', 'c42'], created: '2024-09-01', owner: 'SI' },
  { id: 'col-ai-leads', name: 'AI prospects Q4', companyIds: [], created: '2024-09-20', owner: 'SI' },
  // team collections that already contain the demo company (Lumen Bank is "In 19 collections")
  ...DEMO_NAMES.map(([name, owner], i) => ({
    id: `col-demo-${i}`, name, owner, tag: i % 3 === 0, created: `2024-0${(i % 9) + 1}-1${i % 9}`,
    companyIds: ['lumen-bank', ...Array.from({ length: 4 + (i % 7) }, (_, k) => `c${(i * 37 + k * 11) % 4999 + 1}`)],
  })),
];

/** Saved collections, with any demo collections the browser doesn't have yet merged in. */
function initial(): Collection[] {
  const saved = load<Collection[]>(KEY, []);
  const have = new Set(saved.map((c) => c.id));
  return [...saved, ...DEFAULTS.filter((d) => !have.has(d.id))];
}

interface State {
  collections: Collection[];
  create: (name: string, ids?: string[]) => Collection;
  addTo: (collectionId: string, ids: string[]) => void;
  removeFrom: (collectionId: string, ids: string[]) => void;
  remove: (collectionId: string) => void;
}

export const useCollections = create<State>((set, get) => ({
  collections: initial(),
  create: (name, ids = []) => {
    const c: Collection = { id: `col-${Date.now().toString(36)}`, name, companyIds: [...new Set(ids)], created: new Date().toISOString().slice(0, 10), owner: 'SI' };
    set((s) => ({ collections: [...s.collections, c] }));
    save(KEY, get().collections);
    return c;
  },
  addTo: (collectionId, ids) => {
    set((s) => ({
      collections: s.collections.map((c) => (c.id === collectionId ? { ...c, companyIds: [...new Set([...c.companyIds, ...ids])] } : c)),
    }));
    save(KEY, get().collections);
  },
  removeFrom: (collectionId, ids) => {
    set((s) => ({
      collections: s.collections.map((c) => (c.id === collectionId ? { ...c, companyIds: c.companyIds.filter((x) => !ids.includes(x)) } : c)),
    }));
    save(KEY, get().collections);
  },
  remove: (collectionId) => {
    set((s) => ({ collections: s.collections.filter((c) => c.id !== collectionId) }));
    save(KEY, get().collections);
  },
}));

export const useCollectionsFor = (companyId: string) =>
  useCollections((s) => s.collections).filter((c) => c.companyIds.includes(companyId));
