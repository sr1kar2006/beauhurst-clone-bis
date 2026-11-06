import { create } from 'zustand';
import type { Query } from '../criteria/types';
import { load, save } from '../lib/storage';

export interface SavedSearch { id: string; name: string; savedAt: string; query: Query }
const KEY = 'nb.savedSearches';

interface State {
  saved: SavedSearch[];
  saveSearch: (name: string, query: Query) => void;
  remove: (id: string) => void;
}

export const useSaved = create<State>((set, get) => ({
  saved: load<SavedSearch[]>(KEY, []),
  saveSearch: (name, query) => {
    const entry: SavedSearch = { id: `s${Date.now().toString(36)}`, name, savedAt: new Date().toISOString(), query: JSON.parse(JSON.stringify(query)) };
    set((s) => ({ saved: [entry, ...s.saved] }));
    save(KEY, get().saved);
  },
  remove: (id) => {
    set((s) => ({ saved: s.saved.filter((x) => x.id !== id) }));
    save(KEY, get().saved);
  },
}));
