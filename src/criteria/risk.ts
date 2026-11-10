import type { CriterionDef, CriterionValue, DateRange, PickerNode, Range } from './types';
import type { Company } from '../data/types';
import { riskOf, CREDIT_BANDS, BAND_LABEL, INSOLVENCY_TYPES } from '../data/riskIndex';
import { finValue, finGrowth, type FinField } from '../data/finIndex';
import { parentEdge, ultimateParentId, pscRegister, isGroupMember } from '../data/groups';
import { getCompany } from '../data/dataset';
import { getPersons } from '../data/persons';
import { allCountries } from '../data/countries/iso3166';
import { getProfile } from '../data/profile/generateProfile';

/** Spec 4.2: risk, ownership, people, financial and filing-date criteria (registry-driven, so they appear in the picker). */
const arr = (v: CriterionValue) => (Array.isArray(v) ? v : []);
const str = (v: CriterionValue) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const inRange = (n: number | undefined, v: CriterionValue) => { const r = (v ?? {}) as Range; if (n == null) return false; return (r.min == null || n >= r.min) && (r.max == null || n <= r.max); };
const inDates = (d: string | undefined, v: CriterionValue) => { const r = (v ?? {}) as DateRange; return !!d && (!r.from || d >= r.from) && (!r.to || d <= r.to); };
const TEXT_OPS = [{ value: 'contains', label: 'contains' }, { value: 'does not contain', label: 'does not contain' }];
const IS_OPS = [{ value: 'is', label: 'is' }, { value: 'is not', label: 'is not' }];
const RANGE = [{ value: 'between', label: 'is between' }];
const BOOL = [{ value: 'yes', label: 'yes' }, { value: 'no', label: 'no' }];
const text = (hay: string, op: string, v: CriterionValue) => { const hit = hay.toLowerCase().includes(str(v)); return op === 'does not contain' ? !hit : hit; };
const is = (have: string | undefined, op: string, v: CriterionValue) => { const hit = !!have && arr(v).includes(have); return op === 'is not' ? !hit : hit; };

const list = (id: string, label: string, options: () => { id: string; label: string }[], get: (c: Company) => string | undefined, extra: Partial<CriterionDef> = {}): CriterionDef =>
  ({ id, label, phrase: label, valueType: 'list-popover', layout: 'one-line', operators: IS_OPS, defaultOperator: 'is', options, predicate: (c, op, v) => is(get(c), op, v), ...extra });
const range = (id: string, label: string, get: (c: Company, v: CriterionValue) => number | undefined, extra: Partial<CriterionDef> = {}): CriterionDef =>
  ({ id, label, phrase: label, valueType: 'range', layout: 'one-line', operators: RANGE, defaultOperator: 'between', unit: '', predicate: (c, _op, v) => inRange(get(c, v), v), ...extra });
const dates = (id: string, label: string, get: (c: Company) => string | undefined): CriterionDef =>
  ({ id, label, phrase: label, valueType: 'date-range', layout: 'one-line', operators: RANGE, defaultOperator: 'between', predicate: (c, _op, v) => inDates(get(c), v) });
const bool = (id: string, label: string, get: (c: Company) => boolean, phrase = label): CriterionDef =>
  ({ id, label, phrase, valueType: 'boolean', layout: 'one-line', operators: BOOL, defaultOperator: 'yes', predicate: (c, op) => (op === 'yes' ? get(c) : !get(c)) });
const textDef = (id: string, label: string, get: (c: Company) => string): CriterionDef =>
  ({ id, label, phrase: label, valueType: 'text', layout: 'one-line', operators: TEXT_OPS, defaultOperator: 'contains', predicate: (c, op, v) => text(get(c), op, v) });

const YEARS = Array.from({ length: 20 }, (_, i) => 2024 - i);
const fin = (id: string, label: string, field: FinField, unit: '£' | '' = '£'): CriterionDef =>
  range(id, label, (c, v) => finValue(c, field, ((v ?? {}) as Range).year ?? undefined), { unit, yearOptions: YEARS });

const pscNames = (c: Company) => { const p = getProfile(c.id); return p ? pscRegister(c, p).map((x) => x.name).join(' | ') : ''; };

export const RISK_DEFS: CriterionDef[] = [
  // Risk
  list('credit-band', 'Credit rating band', () => CREDIT_BANDS.map((b) => ({ id: b, label: `${b}: ${BAND_LABEL[b]}` })), (c) => riskOf(c).band),
  range('credit-limit', 'Credit limit', (c) => riskOf(c).creditLimit, { unit: '£' }),
  range('risk-score', 'Risk score (0 to 100, higher is safer)', (c) => riskOf(c).score),
  list('insolvency-status', 'Insolvency status', () => INSOLVENCY_TYPES.map((t) => ({ id: t, label: t === 'CVA' ? 'Company voluntary arrangement (CVA)' : t })), (c) => riskOf(c).insolvency),
  dates('insolvency-date', 'Insolvency event date', (c) => riskOf(c).insolvencyDate),
  range('ccj-count', 'CCJs (number)', (c) => riskOf(c).ccjCount),
  range('ccj-amount', 'CCJs (total amount)', (c) => riskOf(c).ccjAmount, { unit: '£' }),
  bool('late-filing', 'Late filing', (c) => riskOf(c).lateFiling, 'Has filed accounts late'),
  // Ownership
  {
    id: 'psc-name', label: 'PSC / beneficial owner name', phrase: 'Person with significant control or beneficial owner', valueType: 'text', layout: 'one-line', operators: TEXT_OPS, defaultOperator: 'contains',
    // cheap pre-check before building the profile: only companies with a parent, UBOs, large holders or PSC positions
    predicate: (c, op, v) => text(pscNames(c), op, v),
  },
  textDef('ultimate-parent', 'Ultimate parent name', (c) => (parentEdge(c.id) ? getCompany(ultimateParentId(c.id))?.name ?? '' : '')),
  list('ultimate-parent-country', 'Ultimate parent country', () => allCountries().map((x) => ({ id: x.code, label: `${x.flag} ${x.name}` })), (c) => (parentEdge(c.id) ? getCompany(ultimateParentId(c.id))?.country : undefined), { dividerAfter: 2 }),
  bool('in-group', 'Is a subsidiary in a group', (c) => !!parentEdge(c.id) || (c.isSubsidiary && !isGroupMember(c.id) ? c.isSubsidiary : false), 'Is owned by another company'),
  // People
  textDef('current-director', 'Current director name', (c) => c.directors.filter((d) => !d.resigned).map((d) => d.name).join(' | ')),
  dates('director-appointed', 'Director appointed between', (c) => c.directors.map((d) => d.appointed).sort().at(-1)),
  {
    id: 'director-resigned', label: 'Director resigned between', phrase: 'A director resigned between', valueType: 'date-range', layout: 'one-line', operators: RANGE, defaultOperator: 'between',
    predicate: (c, _op, v) => c.directors.some((d) => inDates(d.resigned, v)),
  },
  // Financials (latest or a specific year)
  fin('fin-turnover', 'Turnover', 'turnover'),
  fin('fin-operating-profit', 'Operating profit', 'operatingProfit'),
  fin('fin-pretax-profit', 'Pre-tax profit', 'preTaxProfit'),
  fin('fin-net-assets', 'Net assets', 'netAssets'),
  fin('fin-total-assets', 'Total assets', 'totalAssets'),
  fin('fin-employees', 'Employees (from accounts)', 'employees', ''),
  range('growth-1y', 'Turnover growth over 1 year (%)', (c) => finGrowth(c, 'turnover', 1)),
  range('growth-3y', 'Turnover growth over 3 years (%)', (c) => finGrowth(c, 'turnover', 3)),
  // Filing dates
  dates('accounts-filed', 'Accounts filed between', (c) => riskOf(c).accountsFiled),
  dates('confirmation-filed', 'Confirmation statement filed between', (c) => riskOf(c).confirmationFiled),
  bool('accounts-overdue', 'Accounts overdue', (c) => riskOf(c).accountsOverdue),
  {
    id: 'next-accounts-due', label: 'Next accounts due before', phrase: 'Next accounts due before', valueType: 'date-range', layout: 'one-line', operators: [{ value: 'between', label: 'between' }], defaultOperator: 'between',
    predicate: (c, _op, v) => inDates(riskOf(c).nextAccountsDue, v),
  },
];

const C = (id: string): PickerNode => ({ kind: 'criterion', id });
export const RISK_GROUPS: PickerNode[] = [
  { kind: 'group', id: 'risk', label: 'Risk and insolvency', children: ['credit-band', 'credit-limit', 'risk-score', 'insolvency-status', 'insolvency-date', 'ccj-count', 'ccj-amount', 'late-filing'].map(C) },
  { kind: 'group', id: 'ownership', label: 'Ownership', children: ['psc-name', 'ultimate-parent', 'ultimate-parent-country', 'in-group'].map(C) },
  { kind: 'group', id: 'financial-accounts', label: 'Financial accounts', children: ['fin-turnover', 'fin-operating-profit', 'fin-pretax-profit', 'fin-net-assets', 'fin-total-assets', 'fin-employees', 'growth-1y', 'growth-3y'].map(C) },
  { kind: 'group', id: 'filing-dates', label: 'Filing dates', children: ['accounts-filed', 'confirmation-filed', 'accounts-overdue', 'next-accounts-due'].map(C) },
];
export const RISK_PEOPLE = ['current-director', 'director-appointed', 'director-resigned'];

// unused import guard for tree-shaking clarity
void getPersons;
