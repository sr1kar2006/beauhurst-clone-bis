/** News categories, sample source links and the global news feed (spec 4.4). All articles are fictional. */
import type { Company } from './types';
import type { NewsItem } from './profile/types';
import { Rng } from './rng';
import { getCompanies } from './dataset';
import { INDUSTRY_BY_ID } from './taxonomies/industries';
import { formatMoney } from '../lib/format';

export const NEWS_CATEGORIES = ['Financial results', 'Credit changes', 'Sector developments', 'M&A', 'Insolvency & administration', 'Leadership changes', 'Regulatory'] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

const RULES: [RegExp, NewsCategory][] = [
  [/results|revenue|profit|record|turnover|annual/i, 'Financial results'],
  [/raises|funding|round|valuation|invest/i, 'Financial results'],
  [/rating|credit|downgrade|upgrade|lender/i, 'Credit changes'],
  [/acquir|merger|buys|takeover|partners with|joint venture/i, 'M&A'],
  [/administrat|liquidat|insolven|receiver|winding/i, 'Insolvency & administration'],
  [/appoints|chief|chair|steps down|CEO|director/i, 'Leadership changes'],
  [/regulator|rules|compliance|fine|licence|authority/i, 'Regulatory'],
];

export function categorize(headline: string): NewsCategory[] {
  const cats = [...new Set(RULES.filter(([re]) => re.test(headline)).map(([, c]) => c))];
  return cats.length ? cats : ['Sector developments'];
}

/** Sample article URL on a reserved example domain (opens in a new tab; never a real publisher). */
export const articleUrl = (source: string, id: string) => `https://news.example.org/${source.replace(/[^a-z0-9.]/gi, '')}/${id}`;

export function enrichNews(items: NewsItem[]): NewsItem[] {
  return items.map((n) => ({ ...n, categories: n.categories ?? categorize(n.headline), url: n.url ?? articleUrl(n.source, n.id) }));
}

const SOURCES = ['cityledger.example', 'marketsdaily.example', 'thebankingdesk.example', 'sectorwatch.example', 'insolvencytoday.example', 'boardroomnews.example', 'regulatoryreview.example'];
const TEMPLATES: Record<NewsCategory, ((c: Company, r: Rng) => string)[]> = {
  'Financial results': [(c, r) => `${c.name} reports ${r.pick(['record', 'improved', 'lower', 'flat'])} annual results`, (c) => `${c.name} turnover passes ${formatMoney((c.turnover ?? 2e6) * 1.1)}`],
  'Credit changes': [(c, r) => `${c.name} credit rating ${r.pick(['upgraded', 'downgraded'])} after accounts filing`, (c) => `Lenders extend ${c.name} facility`],
  'Sector developments': [(c) => `${INDUSTRY_BY_ID.get(c.industries[0])?.label ?? 'Sector'} companies face rising costs, ${c.name} says`, (c) => `${c.name} among firms shaping ${INDUSTRY_BY_ID.get(c.industries[0])?.label ?? 'the sector'}`],
  'M&A': [(c, r) => `${c.name} ${r.pick(['acquires a smaller rival', 'agrees merger talks', 'is acquired by a larger group'])}`, (c) => `${c.name} sells a division to a private equity buyer`],
  'Insolvency & administration': [(c) => `${c.name} appoints administrators`, (c) => `Creditors to meet as ${c.name} enters liquidation`],
  'Leadership changes': [(c, r) => `${c.name} appoints new ${r.pick(['chief executive', 'chair', 'finance director'])}`, (c) => `${c.name} founder steps down from the board`],
  Regulatory: [(c) => `Regulator opens review into ${c.name}'s market`, (c) => `${c.name} granted new operating licence`],
};

export interface GlobalArticle extends NewsItem { companyId: string; country: string; industry: string; categories: NewsCategory[] }
let feed: GlobalArticle[] | null = null;

/** ~4,000 articles across companies and countries, last 24 months, newest first. */
export function globalNews(): GlobalArticle[] {
  if (feed) return feed;
  const r = new Rng(9090);
  const out: GlobalArticle[] = [];
  const all = getCompanies();
  for (let i = 0; i < all.length; i += 4) {
    const c = all[i];
    const n = r.int(0, 2) + (c.listed ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const insolvent = /Liquidation|Administration|Receiver/.test(c.chStatus);
      const cat: NewsCategory = insolvent && k === 0 ? 'Insolvency & administration' : r.pick(NEWS_CATEGORIES.filter((x) => x !== 'Insolvency & administration'));
      const headline = r.pick(TEMPLATES[cat])(c, r);
      const date = new Date(Date.UTC(2024, 10, 15) - r.int(0, 730) * 864e5).toISOString().slice(0, 10);
      const id = `g-${c.id}-${k}`;
      const source = r.pick(SOURCES);
      const cats = [...new Set([cat, ...categorize(headline)])];
      out.push({ id, headline, source, date, tagged: [c.id], companyId: c.id, country: c.country, industry: c.industries[0], categories: cats, url: articleUrl(source, id) });
    }
  }
  feed = out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return feed;
}
