import { describe, expect, it } from 'vitest';
import { allCountries, flagOf } from '../src/data/countries/iso3166';
import { COUNTRY_PROFILES } from '../src/data/countries/profiles';
import { getCompanies, getCompany } from '../src/data/dataset';
import { getProfile } from '../src/data/profile/generateProfile';
import { run } from '../src/query/run';
import { DEMO_QUERY } from '../src/query/presets';
import { formatMoneyLocal } from '../src/lib/money';
import type { Query } from '../src/criteria/types';

describe('countries', () => {
  it('lists all 249 ISO 3166-1 countries, UK and Ireland first, then A to Z', () => {
    const list = allCountries();
    expect(list).toHaveLength(249);
    expect(list.slice(0, 2).map((c) => c.code)).toEqual(['GB', 'IE']);
    const rest = list.slice(2).map((c) => c.name);
    expect([...rest].sort((a, b) => a.localeCompare(b, 'en'))).toEqual(rest);
    expect(new Set(list.map((c) => c.code)).size).toBe(249);
    expect(flagOf('DE')).toBe('🇩🇪');
  });
});

describe('international dataset', () => {
  const all = getCompanies();
  it('covers at least 25 countries besides the UK and Ireland, public and private', () => {
    const others = new Set(all.map((c) => c.country).filter((c) => c !== 'GB' && c !== 'IE'));
    expect(others.size).toBeGreaterThanOrEqual(25);
    const intl = all.filter((c) => c.country !== 'GB' && c.country !== 'IE');
    const listed = intl.filter((c) => c.listed).length / intl.length;
    expect(listed).toBeGreaterThan(0.04);
    expect(intl.filter((c) => c.listed).every((c) => c.ticker && c.exchange)).toBe(true);
  });
  it('uses country-specific registries and identifiers', () => {
    expect(getCompany('de-1')!.registry.name).toBe('Handelsregister');
    expect(getCompany('de-1')!.registry.id).toMatch(/^HRB \d+$/);
    expect(getCompany('fr-1')!.registry.idLabel).toBe('SIREN');
    expect(getCompany('ie-1')!.registry.name).toBe('Companies Registration Office');
    expect(getCompany('us-1')!.registry.id).toMatch(/^\d{2}-\d{7}$/);
  });
  it('formats local money with a GBP equivalent', () => {
    expect(formatMoneyLocal({ currency: 'EUR' }, 10_600_000)).toBe('€12.4m (≈£10.6m)');
    expect(formatMoneyLocal({ currency: 'GBP' }, 10_600_000)).toBe('£10.6m');
  });
});

describe('country scope', () => {
  const all = getCompanies();
  const base: Query = { entity: 'companies', combinator: 'all', criteria: [] };
  it('pre-filters by the sentence-header countries', () => {
    const ukie = run({ ...base, countries: ['GB', 'IE'] }, all);
    expect(ukie.every((c) => c.country === 'GB' || c.country === 'IE')).toBe(true);
    expect(run({ ...base, countries: [] }, all)).toHaveLength(all.length);
    expect(run({ ...base, countries: ['JP'] }, all).length).toBe(all.filter((c) => c.country === 'JP').length);
  });
  it('Country criterion is / is not partition the set', () => {
    const is = run({ ...base, criteria: [{ uid: 'x', defId: 'country', op: 'is', value: ['DE', 'FR'] }] }, all).length;
    const not = run({ ...base, criteria: [{ uid: 'x', defId: 'country', op: 'is not', value: ['DE', 'FR'] }] }, all).length;
    expect(is + not).toBe(all.length);
    expect(is).toBe(all.filter((c) => c.country === 'DE' || c.country === 'FR').length);
  });
  it('Listed / Private criterion', () => {
    const listed = run({ ...base, criteria: [{ uid: 'x', defId: 'listing-status', op: 'is', value: ['Listed'] }] }, all);
    expect(listed.length).toBeGreaterThan(100);
    expect(listed.every((c) => c.listed)).toBe(true);
  });
  it('searches ~12,000 companies in under 150 ms', () => {
    const q = { ...DEMO_QUERY, countries: [] as string[], criteria: DEMO_QUERY.criteria.map((c) => ({ ...c, uid: c.uid + 'perf' })) };
    const t = performance.now();
    for (let i = 0; i < 5; i++) run({ ...q, combinator: i % 2 ? 'all' : 'any' }, all.slice(0, all.length - i));
    expect((performance.now() - t) / 5).toBeLessThan(150);
  });
});

describe('profile parity', () => {
  const SECTION_DATA = (id: string) => {
    const p = getProfile(id)!;
    return {
      details: p.registeredName && p.locationHierarchy.length,
      timeline: p.timeline.length, activity: p.activity.length, transactions: p.transactions.length, people: p.people.directors.length + p.people.keyPeople.length,
      ownership: p.ownership.filings.length, corporate: p.corporateTree ? 1 : 0, commodities: p.commodities ? 1 : 0, patents: p.patents.length,
      financials: p.financials.length, charges: p.charges.length, filings: p.filings.length, news: p.news.length,
    };
  };
  it.each(COUNTRY_PROFILES.map((p) => p.code))('showcase company in %s has data in every section', (code) => {
    const id = `${code.toLowerCase()}-1`;
    const data = SECTION_DATA(id);
    for (const [k, v] of Object.entries(data)) expect(v, `${id} ${k}`).toBeTruthy();
  });
  it('uses the jurisdiction filing vocabulary', () => {
    const de = getProfile('de-1')!;
    expect(de.filings.some((f) => f.code === 'Jahresabschluss')).toBe(true);
    expect(de.filings.some((f) => f.code === 'CS01' || f.code === 'AA')).toBe(false);
    expect(getProfile('us-1')!.filings.some((f) => f.code === '8-K')).toBe(true);
    expect(de.addresses.headOffice.at(-1)).toBe('Germany');
    expect(de.timeline.find((e) => e.type === 'Incorporation')!.parts[0]).toContain('Handelsregister');
  });
});
