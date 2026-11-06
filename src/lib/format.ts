/** £90.1k / £1.58m / £17.9m / £1.01b — three significant figures. */
export function formatMoney(v: number | undefined | null): string {
  if (v == null || !isFinite(v) || v <= 0) return '';
  const units: [number, string][] = [[1e9, 'b'], [1e6, 'm'], [1e3, 'k']];
  for (const [d, s] of units) {
    if (v >= d) return `£${sig3(v / d)}${s}`;
  }
  return `£${Math.round(v)}`;
}
function sig3(n: number): string {
  if (n >= 100) return String(Math.round(n));
  if (n >= 10) return trim(n.toFixed(1));
  return trim(n.toFixed(2));
}
function trim(s: string) {
  return s.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function formatDate(d: string | Date | undefined | null): string {
  if (!d) return '';
  const dt = typeof d === 'string' ? new Date(d) : d;
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${dt.getFullYear()}`;
}

export const formatInt = (n: number) => n.toLocaleString('en-GB');

export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export function pct(n: number, d: number, digits = 1): string {
  if (!d) return '0%';
  return `${((n / d) * 100).toFixed(digits)}%`;
}

export function quarterOf(d: Date) {
  return Math.floor(d.getMonth() / 3) + 1;
}
export const quarterLabel = (y: number, q: number) => `Q${q} - ${y}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`.replace(/(\d)(st|nd|rd)$/, (m, d, s) => (['1', '2', '3'].includes(d) ? m : `${d}th`));
const parts = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return { y, m: m - 1, d }; };

/** "8th May 2024" */
export function formatLongDate(iso?: string | null): string {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return `${ordinal(d)} ${MONTHS[m]} ${y}`;
}
/** "Sept. 12, 2023" */
export function formatShortMonthDate(iso?: string | null): string {
  if (!iso) return '';
  const { y, m, d } = parts(iso);
  return `${SHORT[m]} ${d}, ${y}`;
}
/** "November 2024" */
export function formatMonthYear(iso: string): string {
  const { y, m } = parts(iso);
  return `${MONTHS[m]} ${y}`;
}
/** 1234567 -> "1,234,567"; negatives in brackets "(444,000,000)" */
export function formatAccounting(n: number): string {
  const s = Math.abs(Math.round(n)).toLocaleString('en-GB');
  return n < 0 ? `(${s})` : s;
}
export function addDays(iso: string, days: number): string {
  const d = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
