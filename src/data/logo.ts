import type { Rng } from './rng';

const PALETTE = ['#4B4291', '#467BAD', '#34C345', '#B61483', '#E0662E', '#4DA29D', '#282828', '#C98A1E', '#3F7DB6', '#7A3E9D', '#D7263D', '#1B998B', '#2E4057', '#F46036'];

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0] ?? '?').slice(0, 2).replace(/^./, (c) => c.toUpperCase());
}

/** Generated SVG monogram as a data URI. */
export function makeLogo(name: string, r: Rng): string {
  const bg = r.pick(PALETTE);
  const style = r.int(0, 2);
  const txt = initials(name).replace(/&/g, '&amp;');
  const shape =
    style === 0 ? `<rect width="64" height="64" fill="${bg}"/>`
    : style === 1 ? `<rect width="64" height="64" fill="#fff"/><circle cx="32" cy="32" r="26" fill="${bg}"/>`
    : `<rect width="64" height="64" fill="#fff"/><rect x="8" y="8" width="48" height="48" rx="10" fill="${bg}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${shape}<text x="32" y="33" font-family="Arial,Helvetica,sans-serif" font-size="${txt.length > 1 ? 22 : 28}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${txt}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
