import type { User } from '../auth/users';
import type { UsageLog, Session, View, ExportEvent } from './model';

export interface Range { from: number; to: number } // ms, inclusive from, exclusive to

export type Preset = 'today' | '7d' | '30d' | 'month' | 'quarter' | 'ytd' | 'custom';
export const PRESETS: { id: Preset; label: string }[] = [
  { id: 'today', label: 'Today' }, { id: '7d', label: 'Last 7 days' }, { id: '30d', label: 'Last 30 days' }, { id: 'month', label: 'This month' },
  { id: 'quarter', label: 'Last quarter' }, { id: 'ytd', label: 'Year to date' }, { id: 'custom', label: 'Custom' },
];
const DAY = 864e5;

export function presetRange(p: Preset, today = new Date()): Range {
  const t0 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const tomorrow = t0 + DAY;
  switch (p) {
    case 'today': return { from: t0, to: tomorrow };
    case '7d': return { from: t0 - 6 * DAY, to: tomorrow };
    case '30d': return { from: t0 - 29 * DAY, to: tomorrow };
    case 'month': return { from: Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1), to: tomorrow };
    case 'quarter': { const q = Math.floor(today.getUTCMonth() / 3); const start = Date.UTC(today.getUTCFullYear(), (q - 1) * 3, 1); return { from: start, to: Date.UTC(today.getUTCFullYear(), q * 3, 1) }; }
    case 'ytd': return { from: Date.UTC(today.getUTCFullYear(), 0, 1), to: tomorrow };
    default: return { from: t0 - 29 * DAY, to: tomorrow };
  }
}

const inR = (t: number, r: Range) => t >= r.from && t < r.to;

export interface UserRow { user: User; sessions: number; connectionMs: number; lastLogin: number | null; views: number; exports: number }
export interface UsageReport {
  kpis: { activeUsers: number; sessions: number; avgSessionMs: number; connectionMs: number; views: number; exports: number };
  daily: { day: string; active: number }[];
  perUser: UserRow[];
  bySection: { section: string; views: number }[];
  topCompanies: { id: string; name: string; views: number; users: number }[];
}

/** Aggregate usage for a period. Pure: easy to unit test. */
export function usageReport(log: UsageLog, users: User[], r: Range): UsageReport {
  const sessions = log.sessions.filter((s) => inR(s.start, r));
  const views = log.views.filter((v) => inR(v.ts, r));
  const exports = log.exports.filter((e) => inR(e.ts, r));
  const dur = (s: Session) => Math.max(0, s.end - s.start);
  const days = new Map<string, Set<string>>();
  for (let t = r.from; t < r.to; t += DAY) days.set(new Date(t).toISOString().slice(0, 10), new Set());
  sessions.forEach((s) => days.get(new Date(s.start).toISOString().slice(0, 10))?.add(s.userId));
  const lastLogin = new Map<string, number>();
  log.sessions.forEach((s) => { if (s.start < r.to && s.start > (lastLogin.get(s.userId) ?? 0)) lastLogin.set(s.userId, s.start); });
  const perUser: UserRow[] = users.map((u) => {
    const us = sessions.filter((s) => s.userId === u.id);
    return { user: u, sessions: us.length, connectionMs: us.reduce((n, s) => n + dur(s), 0), lastLogin: lastLogin.get(u.id) ?? null, views: views.filter((v) => v.userId === u.id).length, exports: exports.filter((e) => e.userId === u.id).length };
  });
  const bySection = new Map<string, number>();
  views.forEach((v) => bySection.set(v.section, (bySection.get(v.section) ?? 0) + 1));
  const comp = new Map<string, { name: string; views: number; users: Set<string> }>();
  views.filter((v) => v.entityType === 'company' && v.entityId).forEach((v) => {
    const c = comp.get(v.entityId!) ?? { name: v.label ?? v.entityId!, views: 0, users: new Set<string>() };
    c.views++; c.users.add(v.userId); comp.set(v.entityId!, c);
  });
  const total = sessions.reduce((n, s) => n + dur(s), 0);
  return {
    kpis: { activeUsers: new Set(sessions.map((s) => s.userId)).size, sessions: sessions.length, avgSessionMs: sessions.length ? total / sessions.length : 0, connectionMs: total, views: views.length, exports: exports.length },
    daily: [...days.entries()].map(([day, set]) => ({ day, active: set.size })),
    perUser,
    bySection: [...bySection.entries()].map(([section, v]) => ({ section, views: v })).sort((a, b) => b.views - a.views),
    topCompanies: [...comp.entries()].map(([id, c]) => ({ id, name: c.name, views: c.views, users: c.users.size })).sort((a, b) => b.views - a.views).slice(0, 15),
  };
}

export interface SessionLogRow { session: Session; durationMs: number; pages: number; exports: ExportEvent[] }
export function sessionLog(log: UsageLog, userId: string, r: Range): SessionLogRow[] {
  return log.sessions.filter((s) => s.userId === userId && inR(s.start, r)).sort((a, b) => b.start - a.start).map((s) => ({
    session: s, durationMs: Math.max(0, s.end - s.start), pages: log.views.filter((v) => v.sessionId === s.id).length,
    exports: log.exports.filter((e) => e.userId === userId && e.ts >= s.start && e.ts <= s.end + 60e3),
  }));
}

export function viewsReport(log: UsageLog, userId: string, r: Range): View[] {
  return log.views.filter((v) => v.userId === userId && inR(v.ts, r) && v.entityType).sort((a, b) => b.ts - a.ts);
}

export const fmtDuration = (ms: number) => {
  const m = Math.round(ms / 60e3);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')} min`;
};
