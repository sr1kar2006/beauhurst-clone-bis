import type { CriterionDef, CriterionValue, DateRange, Option, PickerNode, Range } from './types';
import type { Company } from '../data/types';
import { getPerson, currentAppointments, previousAppointments, isInsolvent, type Person } from '../data/persons';
import { getCompany } from '../data/dataset';
import { allCountries } from '../data/countries/iso3166';

/** Criteria for `Find [people] where …` (spec 3.6.4). Predicates receive a Person (the registry types them as Company). */
const str = (v: CriterionValue) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const arr = (v: CriterionValue) => (Array.isArray(v) ? v : []);
const inRange = (n: number, v: CriterionValue) => { const r = (v ?? {}) as Range; return (r.min == null || n >= r.min) && (r.max == null || n <= r.max); };
const inDates = (d: string | undefined, v: CriterionValue) => { const r = (v ?? {}) as DateRange; return !!d && (!r.from || d >= r.from) && (!r.to || d <= r.to); };
const names = (ids: string[]) => ids.map((id) => getCompany(id)?.name.toLowerCase() ?? '').join(' | ');
const P = (pred: (p: Person, op: string, v: CriterionValue) => boolean) => pred as unknown as (c: Company, op: string, v: CriterionValue) => boolean;
const TEXT_OPS = [{ value: 'contains', label: 'contains' }, { value: 'does not contain', label: 'does not contain' }];
const text = (hay: string, op: string, v: CriterionValue) => { const hit = hay.includes(str(v)); return op === 'does not contain' ? !hit : hit; };

export const PEOPLE_DEFS: CriterionDef[] = [
  { id: 'p-name', label: 'Name', phrase: 'Name', valueType: 'text', layout: 'one-line', operators: TEXT_OPS, defaultOperator: 'contains', predicate: P((p, op, v) => text(p.name.toLowerCase(), op, v)) },
  { id: 'p-current-at', label: 'Current directorship at', phrase: 'Current directorship at company', valueType: 'text', layout: 'one-line', operators: TEXT_OPS, defaultOperator: 'contains', predicate: P((p, op, v) => text(names(currentAppointments(p).map((a) => a.companyId)), op, v)) },
  { id: 'p-previous-at', label: 'Previous directorship at', phrase: 'Previous directorship at company', valueType: 'text', layout: 'one-line', operators: TEXT_OPS, defaultOperator: 'contains', predicate: P((p, op, v) => text(names(previousAppointments(p).map((a) => a.companyId)), op, v)) },
  {
    id: 'p-role', label: 'Role', phrase: 'Holds a role as', valueType: 'list-popover', layout: 'one-line', operators: [{ value: 'is', label: 'any of' }, { value: 'is not', label: 'none of' }], defaultOperator: 'is',
    options: () => ['Director', 'Shareholder', 'PSC', 'Secretary'].map((x) => ({ id: x, label: x === 'PSC' ? 'Person with significant control' : x })),
    predicate: P((p, op, v) => { const roles = new Set([...(p.appointments.length ? ['Director'] : []), ...p.positions.map((x) => x.kind)]); const hit = arr(v).some((r) => roles.has(r)); return op === 'is not' ? !hit : hit; }),
  },
  {
    id: 'p-country', label: 'Country of residence', phrase: 'Country of residence', valueType: 'list-popover', layout: 'one-line', operators: [{ value: 'is', label: 'is' }, { value: 'is not', label: 'is not' }], defaultOperator: 'is', dividerAfter: 2,
    options: (): Option[] => allCountries().map((c) => ({ id: c.code, label: `${c.flag} ${c.name}` })),
    predicate: P((p, op, v) => { const hit = arr(v).includes(p.country); return op === 'is not' ? !hit : hit; }),
  },
  { id: 'p-num-current', label: 'Number of current appointments', phrase: 'Number of current appointments', valueType: 'range', layout: 'one-line', operators: [{ value: 'between', label: 'is between' }], defaultOperator: 'between', unit: '', predicate: P((p, _op, v) => inRange(currentAppointments(p).length, v)) },
  { id: 'p-appointed', label: 'Appointed between', phrase: 'Appointed to any board', valueType: 'date-range', layout: 'one-line', operators: [{ value: 'between', label: 'between' }], defaultOperator: 'between', predicate: P((p, _op, v) => p.appointments.some((a) => inDates(a.appointed, v))) },
  { id: 'p-resigned', label: 'Resigned between', phrase: 'Resigned from any board', valueType: 'date-range', layout: 'one-line', operators: [{ value: 'between', label: 'between' }], defaultOperator: 'between', predicate: P((p, _op, v) => p.appointments.some((a) => inDates(a.resigned, v))) },
  {
    id: 'p-insolvency', label: 'Has insolvency history', phrase: 'Was a director of a company that entered insolvency', valueType: 'boolean', layout: 'one-line', operators: [{ value: 'yes', label: 'yes' }, { value: 'no', label: 'no' }], defaultOperator: 'yes',
    predicate: P((p, op) => { const hit = p.appointments.some((a) => { const c = getCompany(a.companyId); return !!c && isInsolvent(c); }); return op === 'yes' ? hit : !hit; }),
  },
];

const C = (id: string): PickerNode => ({ kind: 'criterion', id });
export const PEOPLE_PICKER_TREE: PickerNode[] = [
  C('p-name'), C('p-country'),
  { kind: 'group', id: 'p-appointments', label: 'Appointments', children: [C('p-current-at'), C('p-previous-at'), C('p-role'), C('p-num-current'), C('p-appointed'), C('p-resigned')] },
  { kind: 'group', id: 'p-risk', label: 'Risk', children: [C('p-insolvency')] },
];

export const personById = getPerson;
