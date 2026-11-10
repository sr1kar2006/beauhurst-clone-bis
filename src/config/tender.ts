/**
 * Every figure that could read as a claim about the real service lives here.
 *
 * HONESTY RULE: values marked `status: 'sample'` are placeholders for the client demo, NOT commitments.
 * The UI renders a "Sample" tag next to any value whose status is 'sample' (see components/ui/Sample.tsx).
 * Flip a value to 'confirmed' only when the bid team has signed it off.
 */
export interface TenderValue<T> { value: T; status: 'sample' | 'confirmed'; note: string }

const sample = <T,>(value: T, note = 'Placeholder for the client demo; to be confirmed by the bid team.'): TenderValue<T> => ({ value, status: 'sample', note });

/** Read a value (convenience for places that only need the raw value). */
export function tv<T>(v: TenderValue<T>): T { return v.value; }

export const DATASETS = [
  { id: 'company-details', label: 'Company details' },
  { id: 'officers', label: 'Officers & directors' },
  { id: 'ownership', label: 'PSC & ownership' },
  { id: 'accounts', label: 'Accounts & financials' },
  { id: 'filings', label: 'Filings' },
  { id: 'credit', label: 'Credit & risk' },
  { id: 'news', label: 'News' },
  { id: 'fundraisings', label: 'Fundraisings' },
  { id: 'trade', label: 'Commodity trade' },
] as const;
export type DatasetId = (typeof DATASETS)[number]['id'];

export interface Coverage { from: number; frequency: string; lagDays: number }

/** Baseline coverage per dataset (applies to UK). Other countries derive from it via COUNTRY_DEPTH_OFFSET. */
const BASE_COVERAGE: Record<DatasetId, Coverage> = {
  'company-details': { from: 2005, frequency: 'Daily', lagDays: 1 },
  officers: { from: 2005, frequency: 'Daily', lagDays: 1 },
  ownership: { from: 2016, frequency: 'Daily', lagDays: 2 },
  accounts: { from: 2005, frequency: 'Daily', lagDays: 3 },
  filings: { from: 2005, frequency: 'Daily', lagDays: 1 },
  credit: { from: 2010, frequency: 'Weekly', lagDays: 7 },
  news: { from: 2012, frequency: 'Hourly', lagDays: 0 },
  fundraisings: { from: 2011, frequency: 'Daily', lagDays: 5 },
  trade: { from: 2015, frequency: 'Monthly', lagDays: 45 },
};

/** Years of history lost relative to the UK baseline, and a multiplier on lag, per country (sample). */
const COUNTRY_ADJUST: Record<string, { depthOffset: number; lagFactor: number; frequency?: string }> = {
  GB: { depthOffset: 0, lagFactor: 1 },
  IE: { depthOffset: 1, lagFactor: 1.5 },
  US: { depthOffset: 0, lagFactor: 1.2 },
  DE: { depthOffset: 3, lagFactor: 2, frequency: 'Weekly' },
  FR: { depthOffset: 2, lagFactor: 1.5 },
  NL: { depthOffset: 3, lagFactor: 1.5 },
  SE: { depthOffset: 2, lagFactor: 1.5 },
};
const DEFAULT_ADJUST = { depthOffset: 5, lagFactor: 2.5, frequency: 'Weekly' };

export function coverageFor(dataset: DatasetId, country: string): TenderValue<Coverage> {
  const base = BASE_COVERAGE[dataset];
  const adj = COUNTRY_ADJUST[country] ?? DEFAULT_ADJUST;
  const noTrade = dataset === 'trade' && !['GB', 'IE'].includes(country);
  return sample({
    from: noTrade ? 2019 : base.from + adj.depthOffset,
    frequency: dataset === 'news' ? base.frequency : (adj.frequency ?? base.frequency),
    lagDays: Math.round(base.lagDays * adj.lagFactor),
  });
}

export const TENDER = {
  clientOrg: sample('Client Organisation', 'Client organisation name shown in the admin console.'),
  seats: sample(30, 'Number of named user licences in the tender.'),
  fullAccess: { value: true, status: 'confirmed', note: 'CMA clarification: all users receive full functionality; admins only add the Admin console.' } as TenderValue<boolean>,

  // ---- bulk export allowance (CMA clarification 2.3)
  bulkAllowanceRows: sample(250_000, 'Monthly bulk-export allowance in rows.'),
  overagePer1000: sample(4.5, 'Charge in GBP per 1,000 rows beyond the allowance. £X placeholder.'),
  allowanceResetDay: sample(1, 'Day of month the allowance resets.'),
  standardExports: sample('Unlimited', 'Standard (non-bulk) exports are included without limit.'),
  bulkThreshold: sample(5_000, 'Exports above this many rows run as a background bulk job.'),
  rowsPerFile: sample(5_000, 'Bulk exports are split into files of at most this many rows.'),
  exportExpiryDays: sample(7, 'Days a finished export stays available on the Downloads page.'),
  fairUse: sample('Automated scraping and redistribution of exports to third parties are not permitted. Allowances are reviewed quarterly.'),

  // ---- FX (comparison + local currency display)
  fxDate: sample('2024-11-15', 'Date of the sample FX rates.'),
  /** units of currency per 1 GBP */
  fxPerGbp: sample<Record<string, number>>({
    GBP: 1, EUR: 1.17, USD: 1.27, SEK: 13.6, DKK: 8.73, NOK: 13.9, CHF: 1.11, PLN: 5.08, INR: 107, SGD: 1.7,
    JPY: 196, AUD: 1.95, CAD: 1.78, AED: 4.66, ILS: 4.74, BRL: 7.3, ZAR: 23.1, HKD: 9.88, NZD: 2.15,
  }),

  // ---- provenance / corrections
  correctionTurnaround: sample('5 working days', 'Target time from a reported error to a published correction.'),
  qaSampleRate: sample('2% of records manually reviewed each week'),

  // ---- support (M13)
  supportHours: sample('Monday to Friday, 08:00 to 18:00 UK time, excluding bank holidays'),
  supportChannels: sample(['In-app contact form', 'Email: support@example.org', 'Telephone (named account manager)']),
  slas: sample([
    { level: 'P1', name: 'Critical', example: 'Service unavailable for all users', response: '30 minutes', resolution: '4 hours' },
    { level: 'P2', name: 'High', example: 'Core feature unavailable (search, export)', response: '2 hours', resolution: '1 working day' },
    { level: 'P3', name: 'Medium', example: 'Feature degraded, workaround exists', response: '1 working day', resolution: '5 working days' },
    { level: 'P4', name: 'Low', example: 'Question, cosmetic issue or data query', response: '2 working days', resolution: 'Next release' },
  ]),
  availability: sample('99.5% monthly, excluding planned maintenance'),
  releaseCadence: sample('Fortnightly releases; emergency fixes as needed'),
  maintenanceWindow: sample('Sundays 06:00 to 08:00 UK time, with 5 working days notice'),
  dataRetention: sample('Usage logs kept for 24 months; exports deleted after 7 days'),
  hosting: sample('UK-hosted cloud infrastructure, ISO 27001 certified provider'),
  rpoRto: sample('RPO 1 hour, RTO 4 hours'),
} as const;
