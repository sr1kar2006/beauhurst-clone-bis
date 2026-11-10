/**
 * Central logger. Console in development; a pluggable transport later (e.g. an HTTP collector or APM).
 * Usage: logger.error('export failed', { format }); setLogTransport((entry) => fetch('/log', { method: 'POST', body: JSON.stringify(entry) }));
 */
export type Level = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry { level: Level; message: string; context?: Record<string, unknown>; ts: string; path: string }
type Transport = (e: LogEntry) => void;

const consoleTransport: Transport = (e) => {
  const fn = e.level === 'error' ? console.error : e.level === 'warn' ? console.warn : console.info;
  if (e.level !== 'debug' || import.meta.env?.DEV) fn(`[${e.level}] ${e.message}`, e.context ?? '');
};
let transports: Transport[] = [consoleTransport];
const recent: LogEntry[] = [];

export function setLogTransport(t: Transport, keepConsole = true) { transports = keepConsole ? [consoleTransport, t] : [t]; }
export const recentLogs = () => [...recent];

function log(level: Level, message: string, context?: Record<string, unknown>) {
  const e: LogEntry = { level, message, context, ts: new Date().toISOString(), path: typeof location !== 'undefined' ? location.pathname : '' };
  recent.push(e); if (recent.length > 200) recent.shift();
  transports.forEach((t) => { try { t(e); } catch { /* never let logging break the app */ } });
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log('debug', m, c),
  info: (m: string, c?: Record<string, unknown>) => log('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => log('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => log('error', m, c),
};

/** Measure a block with the Performance API and log the duration (search, export …). */
export function timed<T>(name: string, fn: () => T): T {
  const start = `${name}:start`;
  performance.mark(start);
  try { return fn(); } finally {
    const m = performance.measure(name, start);
    logger.debug(`${name} took ${Math.round(m.duration)} ms`);
  }
}
