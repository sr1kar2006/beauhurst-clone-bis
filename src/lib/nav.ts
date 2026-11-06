import { load, save } from './storage';

/** Bridge so non-React code (stores, tour steps) can navigate with the router. */
type NavigateFn = (to: string, opts?: { replace?: boolean }) => void;
let navigateFn: NavigateFn = (to) => { window.location.href = to; };

export function setNavigate(fn: NavigateFn) { navigateFn = fn; }
export function go(to: string, opts?: { replace?: boolean }) { navigateFn(to, opts); }

export const profilePath = (id: string, section?: string) => `/companies/${encodeURIComponent(id)}${section && section !== 'summary' ? `/${section}` : ''}`;

export const LUMEN_ID = 'lumen-bank';

// ---- recently viewed profiles (navbar dropdown)
const RECENT_KEY = 'nb.recentProfiles';
export function recentProfiles(): string[] { return load<string[]>(RECENT_KEY, []); }
export function pushRecentProfile(id: string) {
  save(RECENT_KEY, [id, ...recentProfiles().filter((x) => x !== id)].slice(0, 6));
}
