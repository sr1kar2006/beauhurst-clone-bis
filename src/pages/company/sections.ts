import type { CompanyProfile } from '../../data/profile/types';

export const SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'details', label: 'Details' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'recent-activity', label: 'Recent Activity' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'people', label: 'People' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'corporate-structure', label: 'Corporate Structure' },
  { id: 'commodity-trade', label: 'Commodity Trade' },
  { id: 'patents', label: 'Patents' },
  { id: 'financials', label: 'Financials' },
  { id: 'charges-mortgages', label: 'Charges & Mortgages' },
  { id: 'filing-history', label: 'Filing History' },
  { id: 'news', label: 'News' },
  { id: 'similar-companies', label: 'Similar Companies' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
export const isSection = (s: string | undefined): s is SectionId => !!s && SECTIONS.some((x) => x.id === s);

/** Patents and Charges & Mortgages are disabled when the company has no data for them. */
export function sectionEnabled(id: SectionId, p: CompanyProfile): boolean {
  if (id === 'patents') return p.patents.length > 0;
  if (id === 'charges-mortgages') return p.charges.length > 0;
  return true;
}
