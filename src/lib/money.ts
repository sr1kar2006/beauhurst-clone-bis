import { TENDER } from '../config/tender';
import { formatMoney } from './format';
import type { Company } from '../data/types';

const SYMBOL: Record<string, string> = {
  GBP: '£', EUR: '€', USD: '$', SEK: 'SEK ', DKK: 'DKK ', NOK: 'NOK ', CHF: 'CHF ', PLN: 'PLN ', INR: '₹', SGD: 'S$', JPY: '¥',
  AUD: 'A$', CAD: 'C$', AED: 'AED ', ILS: '₪', BRL: 'R$', ZAR: 'R ', HKD: 'HK$', NZD: 'NZ$',
};
export const currencySymbol = (cur: string) => SYMBOL[cur] ?? `${cur} `;

/** Units of `cur` per 1 GBP, from the sample FX table in tender.ts. */
export function fxPerGbp(cur: string): number {
  return TENDER.fxPerGbp.value[cur] ?? 1;
}
export const gbpTo = (gbp: number, cur: string) => gbp * fxPerGbp(cur);

/** "€12.4m" style, three significant figures, any currency. Values are given in GBP and converted. */
export function formatIn(gbp: number | undefined | null, cur: string): string {
  if (gbp == null || !isFinite(gbp) || gbp <= 0) return '';
  const v = gbpTo(gbp, cur);
  const g = formatMoney(v); // "£12.4m"
  return g ? currencySymbol(cur) + g.slice(1) : '';
}

/**
 * Money for a company: local currency with the GBP equivalent alongside, e.g. "€12.4m (≈£10.6m)".
 * UK companies (and GBP reporters) just get "£10.6m".
 */
export function formatMoneyLocal(c: Pick<Company, 'currency'>, gbp: number | undefined | null): string {
  if (!c.currency || c.currency === 'GBP') return formatMoney(gbp);
  const local = formatIn(gbp, c.currency);
  return local ? `${local} (≈${formatMoney(gbp)})` : '';
}
