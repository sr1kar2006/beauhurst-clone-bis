import { create } from 'zustand';
import { load, save } from '../lib/storage';

export type Agg = 'sum' | 'avg' | 'median' | 'min' | 'max' | 'count';
export interface CalcColumn { id: string; label: string; formula: string }
export type ColFilter = string | { min?: number | null; max?: number | null };

interface Persisted { columns: string[]; calcs: CalcColumn[]; groupBy: string; agg: Agg }
interface State extends Persisted {
  view: 'list' | 'analyse';
  filters: Record<string, ColFilter>;
  setView: (v: 'list' | 'analyse') => void;
  setColumns: (c: string[]) => void;
  addCalc: (c: Omit<CalcColumn, 'id'>) => string;
  removeCalc: (id: string) => void;
  setGroupBy: (g: string) => void;
  setAgg: (a: Agg) => void;
  setFilter: (col: string, f: ColFilter | undefined) => void;
}

const KEY = 'nb.analysis';
const DEFAULT: Persisted = {
  columns: ['name', 'country', 'industry', 'stage', 'turnover', 'employees', 'fundraisingTotal', 'turnoverGrowth1y'],
  calcs: [],
  groupBy: '',
  agg: 'sum',
};
const persisted = load<Persisted>(KEY, DEFAULT);
const persist = (s: Persisted) => save(KEY, { columns: s.columns, calcs: s.calcs, groupBy: s.groupBy, agg: s.agg });

export const useAnalysis = create<State>((set, get) => ({
  ...DEFAULT,
  ...persisted,
  view: 'list',
  filters: {},
  setView: (view) => set({ view }),
  setColumns: (columns) => { set({ columns }); persist(get()); },
  addCalc: (c) => {
    const id = `calc_${Date.now().toString(36)}`;
    set((s) => ({ calcs: [...s.calcs, { ...c, id }], columns: [...s.columns, id] }));
    persist(get());
    return id;
  },
  removeCalc: (id) => { set((s) => ({ calcs: s.calcs.filter((c) => c.id !== id), columns: s.columns.filter((c) => c !== id) })); persist(get()); },
  setGroupBy: (groupBy) => { set({ groupBy }); persist(get()); },
  setAgg: (agg) => { set({ agg }); persist(get()); },
  setFilter: (col, f) => set((s) => { const filters = { ...s.filters }; if (f == null || f === '') delete filters[col]; else filters[col] = f; return { filters }; }),
}));
