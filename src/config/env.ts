/**
 * Deployment settings. The public URL is not decided yet (TODO(Faisal): confirm deployment URL),
 * so nothing in the app hardcodes a domain: everything goes through these helpers.
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

/** Router basename / Vite `base`, e.g. "/" or "/cma-demo/". */
export const BASE_PATH = (env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');

/** Public origin + base for share links and "View online" links in exports. Falls back to the current origin. */
export function publicBaseUrl(): string {
  const configured = env.VITE_PUBLIC_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (typeof window !== 'undefined') return `${window.location.origin}${BASE_PATH}`.replace(/\/+$/, '');
  return '';
}

/** Absolute public URL for an app path such as "/companies/lumen-bank". */
export function publicUrl(path: string): string {
  return `${publicBaseUrl()}/${path.replace(/^\/+/, '')}`;
}

/** Router basename without the trailing slash ("" for root). */
export const ROUTER_BASENAME = BASE_PATH === '/' ? undefined : BASE_PATH.replace(/\/$/, '');
