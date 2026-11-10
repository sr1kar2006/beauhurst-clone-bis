import type { Company } from '../data/types';
import type { CompanyProfile, CorpNode } from '../data/profile/types';
import type { ExportSheet, ExportSpec } from './types';
import { FIN_TABLES } from '../data/profile/financials';
import { countryName } from '../data/countries/iso3166';
import { sourceFor } from '../data/sources';
import { FIELD_BY_ID, kindToFormat } from '../analysis/fields';
import { profilePath } from '../lib/nav';
import { getCompany } from '../data/dataset';

const segText = (parts: (string | { t: string })[]) => parts.map((p) => (typeof p === 'string' ? p : p.t)).join('');

/** Search results with the given field columns. */
export function resultsSpec(rows: Company[], fieldIds: string[], filtersUsed: string[], title = 'Search results'): ExportSpec {
  const fields = fieldIds.filter((f) => FIELD_BY_ID[f]);
  return {
    title, subtitle: `${rows.length.toLocaleString('en-GB')} companies`, filtersUsed, viewPath: '/',
    sheets: [{ name: 'Data', columns: fields.map((f) => ({ key: f, label: FIELD_BY_ID[f].label, format: kindToFormat(FIELD_BY_ID[f].kind) })), rows: rows.map((c) => Object.fromEntries(fields.map((f) => [f, FIELD_BY_ID[f].get(c)]))) }],
    sources: [...new Set(rows.slice(0, 2000).map((c) => sourceFor('company-details', c.country).id)), 'in-house'],
  };
}

/** Full company profile: one sheet per section. */
export function profileSpec(c: Company, p: CompanyProfile): ExportSpec {
  const kv = (rows: [string, unknown][]): ExportSheet['rows'] => rows.map(([k, v]) => ({ k, v: v ?? '—' }));
  const kvCols = [{ key: 'k', label: 'Field', width: 32 }, { key: 'v', label: 'Value', width: 70 }];
  const flat: Record<string, unknown>[] = [];
  const walk = (n: CorpNode, depth: number) => { flat.push({ name: `${'  '.repeat(depth)}${n.name}`, registered: n.registeredName, country: countryName(n.country), consolidated: n.consolidated ? 'Yes' : 'No' }); n.children.forEach((x) => walk(x, depth + 1)); };
  walk(p.corporateTree, 0);
  const years = p.financials;
  const latestOwn = p.ownership.filings[p.ownership.filings.length - 1];
  const sheets: ExportSheet[] = [
    { name: 'Details', columns: kvCols, rows: kv([
      ['Trading name', c.name], ['Registered name', p.registeredName], ['Country', countryName(c.country)], ['Registry', c.registry.name], [c.registry.idLabel, c.registry.id],
      ['Legal form', p.legalForm], ['Incorporated', p.incorporationDate], ['Status', c.chStatus], ['Stage', c.stage], ['Listed', c.listed ? `${c.exchange} ${c.ticker}` : 'Private'],
      ['Reporting currency', c.currency], ['Head office', p.addresses.headOffice.join(', ')], ['Website', c.website], ['Description', c.description],
      ['Credit rating', p.credit.rating], ['Credit limit (GBP)', p.credit.limit],
    ]) },
    { name: 'Timeline', columns: [{ key: 'date', label: 'Date', format: 'date' }, { key: 'type', label: 'Type' }, { key: 'text', label: 'Event', width: 90 }], rows: p.timeline.map((e) => ({ date: e.date, type: e.type, text: segText(e.parts) })) },
    { name: 'Recent activity', columns: [{ key: 'added', label: 'Added', format: 'date' }, { key: 'type', label: 'Type' }, { key: 'text', label: 'Activity', width: 90 }], rows: p.activity.map((a) => ({ added: a.added, type: a.type, text: segText(a.parts) })) },
    { name: 'Transactions', columns: [{ key: 'date', label: 'Date', format: 'date' }, { key: 'label', label: 'Transaction' }, { key: 'amount', label: 'Amount', format: 'gbp' }, { key: 'pre', label: 'Pre-money', format: 'gbp' }, { key: 'inv', label: 'Investors', width: 60 }], rows: p.transactions.map((t) => ({ date: t.date, label: t.label, amount: t.verified ?? t.announced ?? null, pre: t.preMoney ?? null, inv: t.investors.map((i) => i.name).join(', ') })) },
    { name: 'People', columns: [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Position', width: 40 }, { key: 'appointed', label: 'Appointed', format: 'date' }, { key: 'resigned', label: 'Resigned', format: 'date' }], rows: [...p.people.directors, ...p.people.keyPeople, ...p.people.previousDirectors].map((x) => ({ name: x.name, role: x.position, appointed: x.appointed ?? null, resigned: x.resigned ?? null })) },
    { name: 'Ownership', columns: [{ key: 'holder', label: 'Shareholder', width: 40 }, { key: 'cls', label: 'Share class' }, { key: 'shares', label: 'Shares', format: 'int' }], rows: (latestOwn?.holdings ?? []).map((h) => ({ holder: h.shareholder, cls: h.shareClass, shares: h.shares })) },
    { name: 'Corporate structure', columns: [{ key: 'name', label: 'Entity', width: 45 }, { key: 'registered', label: 'Registered name', width: 45 }, { key: 'country', label: 'Country' }, { key: 'consolidated', label: 'Consolidated' }], rows: flat },
    { name: 'Commodity trade', columns: [{ key: 'dir', label: 'Direction' }, { key: 'code', label: 'HS code' }, { key: 'desc', label: 'Commodity', width: 60 }, { key: 'months', label: 'Months traded', format: 'int' }], rows: [...(p.commodities?.imports ?? []).map((h) => ({ dir: 'Import', code: h.code, desc: h.description, months: h.months })), ...(p.commodities?.exports ?? []).map((h) => ({ dir: 'Export', code: h.code, desc: h.description, months: h.months }))] },
    { name: 'Financials', columns: [{ key: 'line', label: 'Line', width: 34 }, ...years.map((y) => ({ key: y.yearEnd, label: y.yearEnd, format: 'gbp' as const }))], rows: FIN_TABLES.flatMap((t) => [{ line: `— ${t.title} —` }, ...t.lines.map((l) => ({ line: l.label, ...Object.fromEntries(years.map((y) => [y.yearEnd, typeof y.values[l.id] === 'number' ? y.values[l.id] : y.values[l.id] == null ? null : String(y.values[l.id])])) }))]) },
    { name: 'Filing history', columns: [{ key: 'date', label: 'Date', format: 'date' }, { key: 'code', label: 'Code' }, { key: 'cat', label: 'Category' }, { key: 'desc', label: 'Description', width: 70 }], rows: p.filings.map((f) => ({ date: f.date, code: f.code, cat: f.category, desc: `${f.lead} ${f.rest}`.trim() })) },
    { name: 'News', columns: [{ key: 'date', label: 'Date', format: 'date' }, { key: 'headline', label: 'Headline', width: 80 }, { key: 'source', label: 'Source' }], rows: p.news.map((n) => ({ date: n.date, headline: n.headline, source: n.source })) },
    { name: 'Patents', columns: [{ key: 'title', label: 'Title', width: 50 }, { key: 'no', label: 'Application' }, { key: 'filed', label: 'Filed', format: 'date' }, { key: 'status', label: 'Status' }], rows: p.patents.map((x) => ({ title: x.title, no: x.applicationNo, filed: x.filed, status: x.status })) },
    { name: 'Charges', columns: [{ key: 'created', label: 'Created', format: 'date' }, { key: 'status', label: 'Status' }, { key: 'entitled', label: 'Persons entitled', width: 40 }], rows: p.charges.map((x) => ({ created: x.created, status: x.status, entitled: x.entitled })) },
  ];
  return {
    title: `${c.name}: company profile`, subtitle: `${p.registeredName} · ${countryName(c.country)} · ${c.registry.idLabel} ${c.registry.id}`,
    sheets, viewPath: profilePath(c.id), orientation: 'landscape', toc: true,
    sources: [...new Set((['company-details', 'officers', 'ownership', 'accounts', 'filings', 'news', 'fundraisings', 'credit'] as const).map((d) => sourceFor(d, c.country).id))],
  };
}

export const similarSpec = (ids: string[], title: string): ExportSpec => resultsSpec(ids.map(getCompany).filter((c): c is Company => !!c), ['name', 'country', 'industry', 'stage', 'turnover', 'employees', 'fundraisingTotal'], [], title);
