export function encodeQ(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
}
export function decodeQ<T>(s: string): T | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))) as T; } catch { return null; }
}
export function readQueryParam(): string | null {
  try { return new URLSearchParams(window.location.search).get('q'); } catch { return null; }
}
export function writeQueryParam(q: string | null) {
  try {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    window.history.replaceState(null, '', url.toString());
  } catch { /* ignore */ }
}
