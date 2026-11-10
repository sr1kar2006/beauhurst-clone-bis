import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bus } from '../lib/eventBus';
import { useAuth } from '../auth/authStore';
import { classify, loadLive, saveLive, type Session } from './model';

/** Idle sessions end after 30 minutes without activity. */
export const IDLE_MS = 30 * 60e3;
let current: Session | null = null;
let lastActivity = 0;

function now() { return Date.now(); }

function endSession(at = lastActivity || now()) {
  if (!current) return;
  const log = loadLive();
  const s = log.sessions.find((x) => x.id === current!.id);
  if (s) s.end = Math.max(s.start, at);
  saveLive(log);
  current = null;
}

function ensureSession(userId: string) {
  const t = now();
  if (current && (current.userId !== userId || t - lastActivity > IDLE_MS)) endSession();
  if (!current) {
    current = { id: `${userId}-live-${t.toString(36)}`, userId, start: t, end: t };
    const log = loadLive();
    log.sessions.push(current);
    saveLive(log);
  }
  lastActivity = t;
}

function recordView(userId: string, path: string) {
  ensureSession(userId);
  const log = loadLive();
  const prev = [...log.views].reverse().find((v) => v.sessionId === current!.id);
  if (prev && !prev.durationMs) prev.durationMs = now() - prev.ts;
  log.views.push({ userId, sessionId: current!.id, ts: now(), durationMs: 0, ...classify(path), label: document.title.split(' · ')[0] });
  const s = log.sessions.find((x) => x.id === current!.id);
  if (s) s.end = now();
  saveLive(log);
}

let installed = false;
function install() {
  if (installed) return;
  installed = true;
  bus.on((name, payload) => {
    const uid = useAuth.getState().currentId;
    if (name === 'export:done' && uid) {
      const p = payload as { title: string; format: string; rows: number };
      const log = loadLive();
      log.exports.push({ userId: uid, ts: now(), rows: p.rows, format: p.format, title: p.title });
      saveLive(log);
    }
    if (name === 'auth:signout') endSession(now());
  });
  const touch = () => { const uid = useAuth.getState().currentId; if (uid) ensureSession(uid); };
  ['click', 'keydown'].forEach((ev) => window.addEventListener(ev, touch, { passive: true }));
  window.addEventListener('beforeunload', () => endSession(now()));
}

/** Records sessions and page views for the signed-in user on every route change. */
export function UsageTracker() {
  const { pathname, search } = useLocation();
  const uid = useAuth((s) => s.currentId);
  useEffect(install, []);
  useEffect(() => {
    if (!uid) return;
    const t = setTimeout(() => recordView(uid, pathname + search), 400); // after the page sets its title
    return () => clearTimeout(t);
  }, [uid, pathname, search]);
  return null;
}
