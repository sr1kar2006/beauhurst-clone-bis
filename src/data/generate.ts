import { fakerEN_GB as faker, type Faker } from '@faker-js/faker';
import { Rng } from './rng';
import type { Company, Director, Fundraising, Gender } from './types';
import { INDUSTRY_ITEMS, AI_ID } from './taxonomies/industries';
import {
  REGIONS, REGION_COORDS, CH_STATUSES, STAGES, Stage, TRACKING, COMPANY_TYPES, LEGAL_FORMS, TARGET_MARKETS, SOCIALS,
  SIGNIFICANT_EVENTS, SIC_CODES, INVESTORS, Region,
} from './taxonomies/misc';
import { SIG } from './taxonomies/signals';
import { makeLogo } from './logo';

/** The "present day" of the dataset (charts run to Q3 2024). */
export const DATA_TODAY = new Date('2024-09-30T00:00:00Z');

const SUFFIX = ['ly', 'ify', 'io', 'able', 'hub', 'base', 'loop', 'lab', 'wise', 'stack', 'flow', 'iq', 'sense', 'ware', 'mind', 'grid'];
const SPACED = ['Labs', 'AI', 'Technologies', 'Systems', 'Health', 'Analytics', 'Robotics', 'Data', 'Studio', 'Digital', 'Works', 'Group'];
const NUMS = [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 21, 24, 32, 42, 99, 101, 360, 1437];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const word = () => faker.word.noun({ length: { min: 3, max: 8 } }).replace(/[^a-zA-Z]/g, '') || 'nova';

function makeName(r: Rng): string {
  const p = r.next();
  if (p < 0.03) {
    const n = r.pick(NUMS);
    return r.pick([`${n}${cap(word())}`, `${n}x.ai`, `${n} ${cap(word())}`, `${n}${r.pick(['AI', 'Co', 'able.AI'])}`, `${n}-${word().toUpperCase().slice(0, 4)}`]);
  }
  if (p < 0.4) return `${cap(word())}${r.pick(SUFFIX)}`;
  if (p < 0.58) return `${cap(faker.word.adjective({ length: { min: 3, max: 7 } }).replace(/[^a-zA-Z]/g, ''))}${cap(word())}`;
  if (p < 0.8) return `${cap(word())} ${r.pick(SPACED)}`;
  if (p < 0.92) return `${cap(word())}${r.pick(['.ai', '.io', 'AI'])}`;
  return `${faker.person.lastName()} & ${faker.person.lastName()}`;
}

const ADJ = ['an AI-powered', 'a cloud-based', 'a data-driven', 'an automated', 'a mobile-first', 'a secure', 'a scalable', 'an open'];
const PRODUCT = ['platform', 'software suite', 'analytics tool', 'marketplace', 'API', 'app', 'workflow engine', 'assistant'];
const AUDIENCE = ['retailers', 'healthcare providers', 'finance teams', 'small businesses', 'local councils', 'manufacturers', 'schools', 'property managers', 'logistics operators', 'legal firms', 'consumers', 'researchers'];
const VERB = ['automate routine tasks', 'make better decisions', 'reduce costs', 'understand their customers', 'manage compliance', 'forecast demand', 'cut carbon emissions', 'streamline operations'];

function weightedYear(r: Rng): number {
  // more foundations post-2016
  const entries: [number, number][] = [];
  for (let y = 1995; y <= 2024; y++) entries.push([y, y < 2005 ? 0.4 : y < 2012 ? 1 : y < 2016 ? 2.2 : y <= 2022 ? 4.2 : 3]);
  return r.weighted(entries);
}

const UK_CITY: Record<Region, string> = {
  London: 'London', 'South East': 'Reading', 'East of England': 'Cambridge', 'North East': 'Newcastle upon Tyne', 'North West': 'Manchester',
  'Yorkshire and the Humber': 'Leeds', 'East Midlands': 'Nottingham', 'West Midlands': 'Birmingham', 'South West': 'Bristol', Wales: 'Cardiff',
  Scotland: 'Edinburgh', Tayside: 'Dundee', 'Northern Ireland': 'Belfast',
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const clampDate = (d: Date) => (d > DATA_TODAY ? new Date(DATA_TODAY) : d);

function gender(r: Rng, pMale = 0.78, pFemale = 0.19): Gender {
  const x = r.next();
  return x < pMale ? 'Male' : x < pMale + pFemale ? 'Female' : 'Unknown';
}

// Common industries for the "industry" ranking skew.
const APP_SW = 'application-software';
const DATA_PROV = 'data-provision';
const INDUSTRY_POOL = INDUSTRY_ITEMS.filter((i) => i.id !== AI_ID && i.id !== APP_SW && i.id !== DATA_PROV);

export interface GenOptions {
  /** id prefix, default "c" */
  idPrefix?: string;
  /** shared across calls so names stay unique in the combined dataset */
  names?: Set<string>;
  /** locale faker for people's names (default en-GB) */
  fk?: Faker;
}

export function generateCompanies(count: number, seed: number, opts: GenOptions = {}): Company[] {
  const r = new Rng(seed);
  faker.seed(seed);
  const fk = opts.fk ?? faker;
  if (opts.fk) opts.fk.seed(seed);
  const names = opts.names ?? new Set<string>();
  const out: Company[] = [];

  for (let i = 0; i < count; i++) {
    let name = makeName(r);
    while (names.has(name.toLowerCase())) name = `${name} ${r.pick(['Ltd', 'UK', 'Group', 'Global'])}`;
    names.add(name.toLowerCase());

    // ---- classification
    const isAI = r.chance(0.65);
    const tags = new Set<string>();
    if (isAI) tags.add(AI_ID);
    if (r.chance(isAI ? 0.82 : 0.35)) tags.add(APP_SW);
    if (r.chance(isAI ? 0.45 : 0.15)) tags.add(DATA_PROV);
    const extra = r.int(isAI ? 0 : 1, 2);
    r.sample(INDUSTRY_POOL, extra).forEach((t) => tags.add(t.id));
    if (!tags.size) tags.add(r.pick(INDUSTRY_POOL).id);

    const stage = r.weighted<Stage>([['Seed', 48], ['Venture', 28], ['Growth', 8.5], ['Established', 3.4], ['Zombie', 2.6], ['Exited', 6.6], ['Dead', 2.6]]);
    const region = r.weighted<Region>(REGIONS.map((reg) => [reg, reg === 'London' ? 42 : reg === 'South East' ? 11 : reg === 'East of England' ? 8 : reg === 'North West' ? 6 : reg === 'Scotland' ? 6 : 3] as const));
    const [lat0, lng0] = REGION_COORDS[region];

    // ---- dates
    const fy = weightedYear(r);
    const founded = clampDate(r.date(new Date(Date.UTC(fy, 0, 1)), new Date(Date.UTC(fy, 11, 31))));
    let ceased: Date | undefined;
    if (stage === 'Dead') ceased = clampDate(r.date(new Date(founded.getTime() + 365 * 864e5), DATA_TODAY));

    // ---- fundraising
    const fundraisings: Fundraising[] = [];
    if (r.chance(0.65)) {
      const rounds = stage === 'Seed' ? r.int(1, 2) : stage === 'Venture' ? r.int(1, 4) : r.int(2, 6);
      const base = stage === 'Seed' ? 180_000 : stage === 'Venture' ? 1_200_000 : 4_000_000;
      let d = new Date(founded.getTime() + r.int(60, 700) * 864e5);
      for (let k = 0; k < rounds && d < DATA_TODAY; k++) {
        const fs: Fundraising['stage'] = k === 0 && stage !== 'Growth' ? 'Seed' : stage === 'Growth' || stage === 'Established' || stage === 'Exited' ? (k > 1 ? 'Growth' : 'Venture') : stage === 'Venture' ? 'Venture' : 'Seed';
        const amount = Math.round(r.logNormal(base * (1 + k * 0.8), 1.05) / 1000) * 1000 + 10_000;
        fundraisings.push({ date: iso(d), amount, stage: fs, investors: r.sample(INVESTORS, r.int(1, 3)) });
        d = new Date(d.getTime() + r.int(240, 900) * 864e5);
      }
    }
    const fundraisingTotal = fundraisings.reduce((s, f) => s + f.amount, 0);

    // ---- signals
    const signals = new Set<string>();
    if (fundraisings.length) signals.add(SIG.equity);
    const s20 = r.chance(0.2);
    if (s20) signals.add(SIG.scale20);
    if (s20 || r.chance(0.15)) signals.add(SIG.scale10);
    if (r.chance(0.08)) signals.add(SIG.debt);
    if (r.chance(0.02)) signals.add(SIG.mbo);
    if (r.chance(0.15)) signals.add(SIG.accelerator);
    if (stage === 'Exited' && r.chance(0.6)) signals.add(SIG.acquired);
    if (r.chance(0.01)) signals.add(SIG.ipo);
    if (r.chance(0.05)) signals.add(SIG.highGrowth);
    const opt: [string, number][] = [
      ['innovation:grant-received', 0.2], ['innovation:patent-filed', 0.08], ['innovation:academic-spinout', 0.04],
      ['innovation:r-and-d-tax-credit', 0.25], ['innovation:innovation-accolade', 0.05],
      ['environmental:environmental-accolades', 0.03], ['environmental:clean-and-renewable-energy', 0.06],
      ['environmental:sustainable-farming-and-food-production', 0.025], ['environmental:green-infrastructure-and-building', 0.035],
      ['environmental:green-transport', 0.03],
      ['social:age-diversity-of-directors', 0.3], ['social:social-impact-accolades', 0.03],
      ['social:gender-equality-of-directors', 0.18], ['social:gender-pay-equality', 0.02],
      ['risk:late-filing', 0.1], ['risk:negative-net-assets', 0.12], ['risk:ccj-registered', 0.02],
      ['risk:director-resignations', 0.08], ['risk:going-concern-warning', 0.03],
    ];
    opt.forEach(([id, p]) => r.chance(p) && signals.add(id));

    // ---- financials
    const hasFull = r.chance(0.1);
    const turnover = hasFull || r.chance(0.08) ? Math.round(r.logNormal(4_000_000, 1.55)) : undefined;
    const employees = r.chance(0.8) ? Math.max(1, Math.round(r.logNormal(stage === 'Seed' ? 5 : stage === 'Venture' ? 14 : 45, 0.9))) : undefined;
    const netAssets = r.chance(0.6) ? Math.round(r.normal() * 800_000 + 300_000) : undefined;

    // ---- people
    const directors: Director[] = Array.from({ length: r.weighted([[1, 3], [2, 4], [3, 3], [4, 2], [5, 1]]) }, () => {
      const g = gender(r);
      const sex = g === 'Female' ? 'female' : 'male';
      const appointed = clampDate(new Date(founded.getTime() + r.int(0, 2500) * 864e5));
      const d: Director = {
        name: `${fk.person.firstName(sex)} ${fk.person.lastName()}`,
        gender: g,
        birthYear: Math.round(1978 + r.normal() * 11),
        appointed: iso(appointed),
      };
      if (r.chance(0.15)) d.resigned = iso(clampDate(new Date(appointed.getTime() + r.int(200, 3000) * 864e5)));
      return d;
    });
    const founders = Array.from({ length: r.int(1, 3) }, () => {
      const g = gender(r, 0.8, 0.17);
      return { name: `${fk.person.firstName(g === 'Female' ? 'female' : 'male')} ${fk.person.lastName()}`, gender: g };
    });

    const events = r.sample(SIGNIFICANT_EVENTS, r.weighted([[0, 4], [1, 3], [2, 2], [3, 1]])).map((type) => ({
      type,
      date: iso(r.date(founded, DATA_TODAY)),
    }));

    const chStatus = r.chance(0.85) ? 'Active' : r.pick(CH_STATUSES.slice(1));
    const legalIdx = r.weighted([[0, 90], [1, 2], [2, 5], [3, 3]]);
    const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const prefix = region === 'Scotland' || region === 'Tayside' ? 'SC' : region === 'Northern Ireland' ? 'NI' : '';
    const chNum = String(r.int(prefix ? 100000 : 6000000, prefix ? 799999 : 15999999)).padStart(prefix ? 6 : 8, '0');

    out.push({
      id: `${opts.idPrefix ?? 'c'}${i + 1}`,
      name,
      logo: makeLogo(name, r),
      description: `${name} develops ${r.pick(ADJ)} ${r.pick(PRODUCT)} that helps ${r.pick(AUDIENCE)} ${r.pick(VERB)}.`,
      businessDescription: `The principal activity of the company is ${r.pick(['the development of software', 'the provision of IT services', 'research and development', 'the provision of consultancy services', 'data processing and hosting'])}.`,
      industries: [...tags],
      headOffice: region,
      lat: lat0 + (r.next() - 0.5) * 0.5,
      lng: lng0 + (r.next() - 0.5) * 0.7,
      companiesHouseId: prefix + chNum,
      // country fields: UK defaults here (no rng draws, so the UK stream is unchanged); see localise.ts
      country: 'GB',
      city: UK_CITY[region],
      currency: 'GBP',
      listed: false,
      registry: { name: 'Companies House', idLabel: 'Company number', id: prefix + chNum },
      registryStatus: chStatus,
      chStatus,
      stage,
      trackingStatus: r.weighted([[TRACKING[0], 72], [TRACKING[1], 17], [TRACKING[2], 11]]),
      signals: [...signals],
      foundedDate: iso(founded),
      ceasedDate: ceased && iso(ceased),
      fundraisingTotal,
      latestFundraisingDate: fundraisings.length ? fundraisings[fundraisings.length - 1].date : undefined,
      fundraisings,
      turnover,
      hasFullFinancials: hasFull,
      netAssets,
      employees,
      directors,
      founders,
      shareholders: Array.from({ length: r.int(1, 12) }, () => fk.person.fullName()),
      events,
      website: r.chance(0.86) ? `https://www.${slugName || 'company'}.co.uk` : undefined,
      socials: r.sample(SOCIALS, r.int(0, 4)),
      companyType: COMPANY_TYPES[legalIdx],
      legalForm: LEGAL_FORMS[legalIdx],
      isSubsidiary: r.chance(0.07),
      targetMarkets: r.sample(TARGET_MARKETS, r.int(1, 2)),
      imports: r.chance(0.12),
      exports: r.chance(0.18),
      sicCodes: r.sample(SIC_CODES, r.int(1, 2)).map((s) => s.code),
      seniorHires: r.weighted([[0, 6], [1, 3], [2, 1]]),
    });
  }
  return out;
}

/** Small secondary datasets for the other entity types. */
const DE_STATES = ['Berlin', 'Bayern', 'Hamburg', 'Hessen', 'Nordrhein-Westfalen', 'Baden-Württemberg', 'Sachsen'];
const DE_COORDS: Record<string, [number, number]> = {
  Berlin: [52.52, 13.4], Bayern: [48.14, 11.58], Hamburg: [53.55, 10], Hessen: [50.11, 8.68],
  'Nordrhein-Westfalen': [51.23, 6.78], 'Baden-Württemberg': [48.78, 9.18], Sachsen: [51.05, 13.74],
};

export function generateSecondary(kind: 'de' | 'funds', count: number, seed: number): Company[] {
  const base = generateCompanies(count, seed);
  const r = new Rng(seed + 7);
  return base.map((c, i) => {
    if (kind === 'de') {
      const st = r.pick(DE_STATES);
      const [lat, lng] = DE_COORDS[st];
      const name = `${c.name.replace(/ (Ltd|UK|Group|Global)$/, '')} ${r.pick(['GmbH', 'AG', 'UG', 'GmbH & Co. KG'])}`;
      return { ...c, id: `de${i + 1}`, name, headOffice: st, country: 'DE', currency: 'EUR', city: st, lat: lat + (r.next() - 0.5) * 0.4, lng: lng + (r.next() - 0.5) * 0.6, companiesHouseId: `HRB ${r.int(10000, 299999)}`, legalForm: 'GmbH', description: c.description };
    }
    const name = `${c.name.split(' ')[0]} ${r.pick(['Fund I', 'Fund II', 'Growth Fund', 'Seed Fund', 'Opportunities Fund', 'EIS Fund'])}`;
    return { ...c, id: `f${i + 1}`, name, description: `${name} is a ${r.pick(['venture capital', 'growth equity', 'EIS', 'impact'])} fund investing in ${r.pick(['early-stage', 'growth-stage', 'deep tech', 'climate'])} companies.` };
  });
}

export { STAGES };
