/**
 * Shared persons table (spec 3.6). Directors are the same people across companies: the pass reuses an existing
 * person of the same gender and a birth year within ±2 years, so gender and age-based search results do not move.
 * About 30% of persons hold two or more appointments, a few up to ten, some across countries. Some persons are also
 * shareholders, PSCs or secretaries elsewhere. Every name is fictional.
 */
import type { Company, Gender } from './types';
import { Rng } from './rng';

export interface Appointment { companyId: string; role: 'Director'; appointed: string; resigned?: string }
export interface OtherPosition { kind: 'Shareholder' | 'PSC' | 'Secretary'; companyId: string; detail: string; since: string }
export interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number;
  birthMonth: number;
  country: string;
  appointments: Appointment[];
  positions: OtherPosition[];
  disqualified?: { from: string; to: string; reason: string };
}

const INSOLVENT = new Set(['In Liquidation', 'In Administration', 'Administration Order', 'Administrative Receiver Appointed', 'Receivership', 'Receiver Manager Appointed', 'Voluntary Arrangement', 'Live but Receiver Manager on at least one charge']);
export const isInsolvent = (c: Company) => INSOLVENT.has(c.chStatus);

let persons: Person[] = [];
let byId = new Map<string, Person>();
let byCompanyName = new Map<string, string>(); // `${companyId}|${name}` → personId

/** Mutates company directors (name, personId) and shareholders; called once by dataset.getCompanies(). */
export function assignPersons(companies: Company[], fixtureIds: Set<string>, seed = 7071) {
  const r = new Rng(seed);
  persons = [];
  byId = new Map();
  byCompanyName = new Map();
  const buckets = new Map<string, Person[]>(); // `${country}|${gender}|${year}`
  const global = new Map<string, Person[]>(); // `${gender}|${year}`
  const push = (m: Map<string, Person[]>, k: string, p: Person) => { const a = m.get(k); if (a) a.push(p); else m.set(k, [p]); };
  const create = (name: string, gender: Gender, birthYear: number, country: string): Person => {
    const p: Person = { id: `p${persons.length + 1}`, name, gender, birthYear, birthMonth: r.int(1, 12), country, appointments: [], positions: [] };
    persons.push(p); byId.set(p.id, p);
    push(buckets, `${country}|${gender}|${birthYear}`, p);
    push(global, `${gender}|${birthYear}`, p);
    return p;
  };
  const pick = (cands: Person[], companyId: string): Person | null => {
    const ok = cands.filter((p) => p.appointments.length < 10 && !p.appointments.some((a) => a.companyId === companyId));
    if (!ok.length) return null;
    // preferential attachment: busy directors attract more appointments (long tail up to 10)
    return r.weighted(ok.map((p) => [p, Math.pow(p.appointments.length, 1.2) + 1.2] as const));
  };

  for (const c of companies) {
    for (const d of c.directors) {
      let p: Person | null = null;
      if (!fixtureIds.has(c.id) && r.chance(0.4)) {
        const cross = r.chance(0.1);
        const cands: Person[] = [];
        for (let y = d.birthYear - 2; y <= d.birthYear + 2; y++) cands.push(...((cross ? global : buckets).get(cross ? `${d.gender}|${y}` : `${c.country}|${d.gender}|${y}`) ?? []));
        p = pick(cands, c.id);
      }
      if (p) d.name = p.name;
      else p = create(d.name, d.gender, d.birthYear, c.country);
      d.personId = p.id;
      p.appointments.push({ companyId: c.id, role: 'Director', appointed: d.appointed, resigned: d.resigned });
      byCompanyName.set(`${c.id}|${d.name}`, p.id);
    }
  }

  // other positions in other companies
  const pool = companies.filter((c) => !fixtureIds.has(c.id));
  for (const p of persons) {
    if (!p.appointments.length) continue;
    const roll = r.next();
    if (roll < 0.12) {
      const c = r.pick(pool);
      if (!p.appointments.some((a) => a.companyId === c.id)) {
        const pct = r.chance(0.3) ? r.int(26, 60) : r.int(1, 24);
        if (c.shareholders.length) c.shareholders[r.int(0, c.shareholders.length - 1)] = p.name; else c.shareholders.push(p.name);
        p.positions.push({ kind: pct > 25 ? 'PSC' : 'Shareholder', companyId: c.id, detail: pct > 25 ? `Ownership of shares: more than 25% (${pct}%)` : `ORDINARY shares, ${pct}% held`, since: c.foundedDate });
        if (pct > 25) p.positions.push({ kind: 'Shareholder', companyId: c.id, detail: `ORDINARY shares, ${pct}% held`, since: c.foundedDate });
        byCompanyName.set(`${c.id}|${p.name}`, p.id);
      }
    } else if (roll < 0.15) {
      const c = r.pick(pool);
      p.positions.push({ kind: 'Secretary', companyId: c.id, detail: 'Company secretary', since: c.foundedDate });
      byCompanyName.set(`${c.id}|${p.name}`, p.id);
    }
  }

  // sample flags: a few directors of failed companies are disqualified
  const companyById = new Map(companies.map((c) => [c.id, c]));
  for (const p of persons) {
    const bad = p.appointments.find((a) => { const c = companyById.get(a.companyId); return c && isInsolvent(c); });
    if (bad && r.chance(0.08)) {
      const from = `${2019 + r.int(0, 5)}-${String(r.int(1, 12)).padStart(2, '0')}-${String(r.int(1, 28)).padStart(2, '0')}`;
      p.disqualified = { from, to: `${Number(from.slice(0, 4)) + r.int(2, 8)}${from.slice(4)}`, reason: 'Unfit conduct in relation to an insolvent company (sample)' };
    }
  }
}

export const getPersons = () => persons;
export const getPerson = (id: string) => byId.get(id);
/** Person id for a name shown on a company (director, shareholder, PSC or secretary). */
export const personIdFor = (companyId: string, name: string) => byCompanyName.get(`${companyId}|${name}`);
export const currentAppointments = (p: Person) => p.appointments.filter((a) => !a.resigned);
export const previousAppointments = (p: Person) => p.appointments.filter((a) => a.resigned);
