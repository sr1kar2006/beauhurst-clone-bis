import { create } from 'zustand';
import { load, save } from '../lib/storage';
import { bus } from '../lib/eventBus';

export const MAX_COMPARE = 6;

export interface SavedComparison { id: string; name: string; ids: string[]; created: string }

interface State {
  ids: string[];
  saved: SavedComparison[];
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  set: (ids: string[]) => void;
  clear: () => void;
  saveComparison: (name: string, ids: string[]) => SavedComparison;
  deleteSaved: (id: string) => void;
}

const KEY = 'nb.compare';
const SAVED_KEY = 'nb.savedComparisons';
const persist = (ids: string[]) => save(KEY, ids);

const SEED_SAVED: SavedComparison[] = [
  { id: 'cmp-demo', name: 'Challenger banks: UK vs Europe (demo)', ids: ['lumen-bank', 'ie-1', 'de-1', 'us-1'], created: '2024-11-08' },
];

export const useCompare = create<State>((set, get) => ({
  ids: load<string[]>(KEY, []),
  saved: load<SavedComparison[]>(SAVED_KEY, SEED_SAVED),
  toggle: (id) => (get().ids.includes(id) ? get().remove(id) : get().add(id)),
  add: (id) => {
    const ids = get().ids;
    if (ids.includes(id) || ids.length >= MAX_COMPARE) return;
    const next = [...ids, id];
    persist(next); set({ ids: next }); bus.emit('compare:add');
  },
  remove: (id) => { const next = get().ids.filter((x) => x !== id); persist(next); set({ ids: next }); },
  set: (ids) => { const next = [...new Set(ids)].slice(0, MAX_COMPARE); persist(next); set({ ids: next }); },
  clear: () => { persist([]); set({ ids: [] }); },
  saveComparison: (name, ids) => {
    const c: SavedComparison = { id: `cmp-${Date.now().toString(36)}`, name, ids, created: new Date().toISOString().slice(0, 10) };
    const saved = [c, ...get().saved];
    save(SAVED_KEY, saved); set({ saved });
    return c;
  },
  deleteSaved: (id) => { const saved = get().saved.filter((s) => s.id !== id); save(SAVED_KEY, saved); set({ saved }); },
}));

export const comparePath = (ids: string[]) => `/compare?ids=${ids.map(encodeURIComponent).join(',')}`;
