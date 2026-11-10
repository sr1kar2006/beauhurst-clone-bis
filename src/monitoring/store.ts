import { create } from 'zustand';
import { load, save } from '../lib/storage';

export type TargetKind = 'company' | 'person' | 'search' | 'collection';
export interface Target { kind: TargetKind; id: string; label: string }
export const EVENT_TYPES = [
  'Financial results', 'Credit changes', 'Sector developments', 'M&A', 'Insolvency & administration', 'Leadership changes', 'Regulatory',
  'Filings', 'Officer changes', 'Ownership changes', 'Credit rating changes', 'Insolvency events', 'New companies matching a saved search',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type Frequency = 'Instant' | 'Daily digest' | 'Weekly digest';
export interface Rule { id: string; target: Target; events: EventType[]; frequency: Frequency; email: boolean; paused: boolean; created: string }
export interface Alert { id: string; ruleId: string; target: Target; type: EventType; title: string; ts: string; read: boolean; link: string; sourceUrl?: string; sourceName?: string }

const RULES_KEY = 'nb.alertRules';
const ALERTS_KEY = 'nb.alerts';
const DEFAULT_EVENTS: EventType[] = ['Financial results', 'Credit changes', 'M&A', 'Insolvency & administration', 'Leadership changes', 'Filings', 'Officer changes', 'Ownership changes'];

const SEED_RULES: Rule[] = [
  { id: 'rule-lumen', target: { kind: 'company', id: 'lumen-bank', label: 'Lumen Bank' }, events: DEFAULT_EVENTS, frequency: 'Instant', email: true, paused: false, created: '2026-10-01' },
  { id: 'rule-watchlist', target: { kind: 'collection', id: 'col-watchlist', label: 'My watchlist' }, events: ['Insolvency & administration', 'Credit rating changes', 'Officer changes'], frequency: 'Daily digest', email: false, paused: false, created: '2026-09-12' },
];
const SEED_ALERTS: Alert[] = [
  { id: 'al-3', ruleId: 'rule-lumen', target: SEED_RULES[0].target, type: 'Financial results', title: 'Lumen Bank filed group accounts for the year to 31 March 2024', ts: '2026-11-07T08:12:00Z', read: false, link: '/companies/lumen-bank/filing-history' },
  { id: 'al-2', ruleId: 'rule-lumen', target: SEED_RULES[0].target, type: 'Leadership changes', title: 'Lumen Bank appointed a new Chief Risk Officer', ts: '2026-11-04T14:30:00Z', read: false, link: '/companies/lumen-bank/people' },
  { id: 'al-1', ruleId: 'rule-watchlist', target: SEED_RULES[1].target, type: 'Credit rating changes', title: 'A company in My watchlist moved from rating B to C', ts: '2026-10-28T09:00:00Z', read: true, link: '/' },
];

interface State {
  rules: Rule[];
  alerts: Alert[];
  addRule: (target: Target, patch?: Partial<Rule>) => Rule;
  updateRule: (id: string, patch: Partial<Rule>) => void;
  removeRule: (id: string) => void;
  addAlerts: (a: Alert[]) => void;
  markRead: (ids: string[], read?: boolean) => void;
}

export const useMonitoring = create<State>((set, get) => {
  const persistRules = (rules: Rule[]) => { save(RULES_KEY, rules); set({ rules }); };
  const persistAlerts = (alerts: Alert[]) => { save(ALERTS_KEY, alerts.slice(0, 300)); set({ alerts }); };
  return {
    rules: load<Rule[]>(RULES_KEY, SEED_RULES),
    alerts: load<Alert[]>(ALERTS_KEY, SEED_ALERTS),
    addRule: (target, patch = {}) => {
      const rule: Rule = { id: `rule-${Date.now().toString(36)}`, target, events: target.kind === 'search' ? ['New companies matching a saved search'] : DEFAULT_EVENTS, frequency: 'Instant', email: false, paused: false, created: new Date().toISOString().slice(0, 10), ...patch };
      persistRules([rule, ...get().rules]);
      return rule;
    },
    updateRule: (id, patch) => persistRules(get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    removeRule: (id) => persistRules(get().rules.filter((r) => r.id !== id)),
    addAlerts: (a) => persistAlerts([...a, ...get().alerts]),
    markRead: (ids, read = true) => persistAlerts(get().alerts.map((x) => (ids.includes(x.id) ? { ...x, read } : x))),
  };
});

export const ruleFor = (t: Pick<Target, 'kind' | 'id'>) => useMonitoring.getState().rules.find((r) => r.target.kind === t.kind && r.target.id === t.id);
