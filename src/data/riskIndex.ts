/**
 * Light risk and filing index per company (spec 4.2): credit band, score and limit, insolvency, CCJs and filing dates.
 * Deterministic from the company record so search criteria, the analysis grid and the profile agree.
 */
import type { Company } from './types';
import { Rng } from './rng';
import { finValue } from './finIndex';

export const CREDIT_BANDS = ['A', 'B', 'C', 'D', 'E'] as const;
export type CreditBand = (typeof CREDIT_BANDS)[number];
export const BAND_LABEL: Record<CreditBand, string> = { A: 'Very low risk', B: 'Low risk', C: 'Moderate risk', D: 'High risk', E: 'Very high risk' };
export const INSOLVENCY_TYPES = ['Administration', 'Liquidation', 'CVA', 'Receivership', 'Strike-off'] as const;
export type InsolvencyType = (typeof INSOLVENCY_TYPES)[number];

export interface RiskInfo {
  score: number; // 0–100, higher = safer
  band: CreditBand;
  rating: string; // "B (63/100) Low risk"
  creditLimit: number;
  insolvency?: InsolvencyType;
  insolvencyDate?: string;
  ccjCount: number;
  ccjAmount: number;
  lateFiling: boolean;
  accountsFiled?: string;
  confirmationFiled: string;
  nextAccountsDue: string;
  accountsOverdue: boolean;
}

const TODAY = '2024-11-15';
const STATUS_TO_INSOLVENCY: Record<string, InsolvencyType> = {
  'In Administration': 'Administration', 'Administration Order': 'Administration', 'In Liquidation': 'Liquidation', 'Voluntary Arrangement': 'CVA',
  Receivership: 'Receivership', 'Administrative Receiver Appointed': 'Receivership', 'Receiver Manager Appointed': 'Receivership', 'Live but Receiver Manager on at least one charge': 'Receivership', Dissolved: 'Strike-off',
};
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const addMonths = (iso: string, m: number) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString().slice(0, 10); };
const cache = new Map<string, RiskInfo>();

export function riskOf(c: Company): RiskInfo {
  const hit = cache.get(c.id);
  if (hit) return hit;
  const r = new Rng(hash(c.id) ^ 0x7f4a7c15);
  const insolvency = STATUS_TO_INSOLVENCY[c.chStatus];
  let score = 30 + r.int(0, 60);
  if (c.signals.includes('risk:negative-net-assets')) score -= 18;
  if (c.signals.includes('risk:ccj-registered')) score -= 15;
  if (c.signals.includes('risk:going-concern-warning')) score -= 20;
  if (c.signals.includes('risk:late-filing')) score -= 8;
  if (c.listed) score += 10;
  if (insolvency) score = r.int(1, 12);
  if (c.id === 'lumen-bank') score = 92;
  score = Math.max(1, Math.min(99, score));
  const band: CreditBand = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'E';
  const turnover = finValue(c, 'turnover') ?? c.turnover ?? 250_000;
  const creditLimit = insolvency ? 0 : Math.round((turnover * (score / 100) * 0.08) / 1000) * 1000 + 1000;
  const ccj = c.signals.includes('risk:ccj-registered') || r.chance(0.015);
  const lateFiling = c.signals.includes('risk:late-filing');
  const fy = Number(c.foundedDate.slice(0, 4));
  const accountsFiled = fy < 2024 ? `${r.chance(0.5) ? 2024 : 2023}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}` : undefined;
  const confirmationFiled = `2024-${String(r.int(1, 10)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`;
  const nextAccountsDue = accountsFiled ? addMonths(accountsFiled, lateFiling ? 9 : 12) : addMonths(c.foundedDate, 21);
  const info: RiskInfo = {
    score, band, rating: `${band} (${score}/100) ${BAND_LABEL[band]}`, creditLimit,
    insolvency, insolvencyDate: insolvency ? (c.ceasedDate ?? `${2019 + r.int(0, 5)}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`) : undefined,
    ccjCount: ccj ? r.int(1, 4) : 0, ccjAmount: ccj ? r.int(2, 180) * 1000 : 0, lateFiling,
    accountsFiled, confirmationFiled, nextAccountsDue, accountsOverdue: nextAccountsDue < TODAY && !insolvency,
  };
  cache.set(c.id, info);
  return info;
}
