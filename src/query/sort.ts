import type { Company } from '../data/types';

export type SortKey = 'name' | 'fundraisingTotal' | 'latestFundraisingDate' | 'turnover' | 'employees' | 'foundedDate';
export interface Sort { key: SortKey; dir: 'asc' | 'desc' }

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/** Numbers sort before letters ("10Cast", "11x.ai", "1437 Studio", "32Co", "3AI" ...). */
export function compareNames(a: string, b: string): number {
  return collator.compare(a, b);
}

export function sortCompanies(list: Company[], sort: Sort): Company[] {
  const dir = sort.dir === 'asc' ? 1 : -1;
  const copy = [...list];
  copy.sort((a, b) => {
    if (sort.key === 'name') return dir * compareNames(a.name, b.name);
    const av = a[sort.key] as number | string | undefined;
    const bv = b[sort.key] as number | string | undefined;
    // missing values always last
    const aMissing = av == null || av === 0 || av === '';
    const bMissing = bv == null || bv === 0 || bv === '';
    if (aMissing && bMissing) return compareNames(a.name, b.name);
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (av! < bv!) return -dir;
    if (av! > bv!) return dir;
    return compareNames(a.name, b.name);
  });
  return copy;
}

export function paginate<T>(list: T[], page: number, size: number): T[] {
  return list.slice((page - 1) * size, page * size);
}

export function pageCount(total: number, size: number) {
  return Math.max(1, Math.ceil(total / size));
}

/** Page list with ellipses: [1, 2, '…', 96, 97] style. */
export function pageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}
