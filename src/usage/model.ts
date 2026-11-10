import { Rng } from '../data/rng';
import { SEED_USERS, INACTIVE_USERS } from '../auth/users';
import { getCompanies } from '../data/dataset';
import { load, save } from '../lib/storage';

export interface Session { id: string; userId: string; start: number; end: number }
export interface View { userId: string; sessionId: string; ts: number; durationMs: number; section: string; entityType?: 'company' | 'person' | 'report' | 'comparison'; entityId?: string; label?: string }
export interface ExportEvent { userId: string; ts: number; rows: number; format: string; title: string }
export interface UsageLog { sessions: Session[]; views: View[]; exports: ExportEvent[] }

export const SECTION_LABEL: Record<string, string> = {
  search: 'Advanced search', company: 'Company profiles', person: 'Person profiles', compare: 'Comparison', reports: 'Reports',
  news: 'News & monitoring', sources: 'Data sources', admin: 'Admin console', downloads: 'Downloads', other: 'Other',
};

/** Classify an app path into a section and entity. */
export function classify(path: string): Pick<View, 'section' | 'entityType' | 'entityId'> {
  const p = path.split('?')[0];
  let m: RegExpExecArray | null;
  if ((m = /^\/companies\/([^/]+)/.exec(p))) return { section: 'company', entityType: 'company', entityId: decodeURIComponent(m[1]) };
  if ((m = /^\/people\/([^/]+)/.exec(p))) return { section: 'person', entityType: 'person', entityId: decodeURIComponent(m[1]) };
  if ((m = /^\/reports\/([^/]+)/.exec(p)) && m[1] !== 'new') return { section: 'reports', entityType: 'report', entityId: m[1] };
  if (p.startsWith('/reports')) return { section: 'reports' };
  if (p.startsWith('/compare')) return { section: 'compare', entityType: 'comparison' };
  if (p.startsWith('/news') || p.startsWith('/alerts') || p.startsWith('/monitoring')) return { section: 'news' };
  if (p.startsWith('/data-sources')) return { section: 'sources' };
  if (p.startsWith('/admin')) return { section: 'admin' };
  if (p.startsWith('/downloads')) return { section: 'downloads' };
  if (p === '/' || p === '') return { section: 'search' };
  return { section: 'other' };
}

const DAY = 864e5;
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

let seeded: UsageLog | null = null;
let seededFor = 0;

/** 12 months of synthetic usage for all 30 users ending yesterday: weekday-heavy, a few inactive users, varied sessions. */
export function seedUsage(today = new Date()): UsageLog {
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (seeded && seededFor === end) return seeded;
  const companies = getCompanies();
  const pool = Array.from({ length: 300 }, (_, i) => companies[(i * 41 + 7) % companies.length]);
  pool.unshift(...companies.filter((c) => ['lumen-bank', 'harrowmere-group', 'de-1', 'ie-1', 'us-1', 'gb-1'].includes(c.id)));
  const sessions: Session[] = [], views: View[] = [], exports: ExportEvent[] = [];
  const SECTIONS: [string, number][] = [['company', 45], ['search', 28], ['person', 7], ['compare', 5], ['reports', 6], ['news', 5], ['sources', 2], ['downloads', 2]];
  for (const u of SEED_USERS) {
    if (u.status === 'Invited') continue;
    const r = new Rng(hash(u.id) ^ 0x51ed);
    const base = INACTIVE_USERS.has(u.id) ? 0.03 : 0.25 + r.next() * 0.6;
    const stopAt = u.status === 'Deactivated' ? end - 19 * DAY : end;
    for (let d = end - 365 * DAY; d < stopAt; d += DAY) {
      const dow = new Date(d).getUTCDay();
      const p = dow === 0 || dow === 6 ? base * 0.06 : base;
      const n = r.chance(p) ? (r.chance(0.18) ? 2 : 1) : 0;
      for (let k = 0; k < n; k++) {
        const start = d + (8 + r.int(0, 8)) * 3600e3 + r.int(0, 59) * 60e3 + k * 3 * 3600e3;
        const minutes = Math.min(180, Math.max(2, Math.round(r.logNormal(22, 0.75))));
        const sid = `${u.id}-${start.toString(36)}`;
        sessions.push({ id: sid, userId: u.id, start, end: start + minutes * 60e3 });
        const pages = Math.max(1, Math.round(minutes / (2 + r.next() * 3)));
        let t = start;
        for (let v = 0; v < pages; v++) {
          const section = r.weighted(SECTIONS);
          const dur = Math.round((minutes * 60e3) / pages);
          const c = section === 'company' ? r.pick(pool) : undefined;
          views.push({ userId: u.id, sessionId: sid, ts: t, durationMs: dur, section, entityType: c ? 'company' : section === 'reports' ? 'report' : undefined, entityId: c?.id ?? (section === 'reports' ? 'rep-demo' : undefined), label: c?.name ?? (section === 'reports' ? 'UK & Ireland AI scale-ups' : undefined) });
          t += dur;
        }
        if (r.chance(0.12)) exports.push({ userId: u.id, ts: start + minutes * 30e3, rows: r.chance(0.2) ? r.int(5_001, 30_000) : r.int(20, 2_000), format: r.pick(['xlsx', 'csv', 'pdf']), title: r.pick(['Search results', 'Company profile', 'Comparison', 'Statistics']) });
      }
    }
  }
  seeded = { sessions, views, exports };
  seededFor = end;
  return seeded;
}

// ---------------------------------------------------------------- live log (this browser)
const LIVE_KEY = 'nb.usage.live';
export const loadLive = (): UsageLog => load<UsageLog>(LIVE_KEY, { sessions: [], views: [], exports: [] });
export const saveLive = (l: UsageLog) => save(LIVE_KEY, { sessions: l.sessions.slice(-300), views: l.views.slice(-2000), exports: l.exports.slice(-300) });

export function allUsage(): UsageLog {
  const s = seedUsage(), l = loadLive();
  return { sessions: [...s.sessions, ...l.sessions], views: [...s.views, ...l.views], exports: [...s.exports, ...l.exports] };
}
