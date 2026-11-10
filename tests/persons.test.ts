import { describe, expect, it } from 'vitest';
import { getCompanies, getOriginalUk } from '../src/data/dataset';
import { getPersons, getPerson, personIdFor, currentAppointments } from '../src/data/persons';
import { run } from '../src/query/run';
import { DEMO_QUERY } from '../src/query/presets';

describe('persons across companies', () => {
  const companies = getCompanies();
  const persons = getPersons();
  it('every director has a stable person id', () => {
    const dirs = companies.flatMap((c) => c.directors);
    expect(dirs.every((d) => d.personId && getPerson(d.personId)?.name === d.name)).toBe(true);
  });
  it('about 30% of persons hold two or more appointments; a few up to 10; some across countries', () => {
    const multi = persons.filter((p) => p.appointments.length >= 2).length / persons.length;
    console.log('persons', persons.length, 'multi', multi.toFixed(3), 'max', Math.max(...persons.map((p) => p.appointments.length)));
    expect(multi).toBeGreaterThan(0.25);
    expect(multi).toBeLessThan(0.38);
    expect(Math.max(...persons.map((p) => p.appointments.length))).toBeLessThanOrEqual(10);
    expect(persons.filter((p) => p.appointments.length >= 6).length).toBeGreaterThan(5);
    const byId = new Map(companies.map((c) => [c.id, c]));
    expect(persons.some((p) => new Set(p.appointments.map((a) => byId.get(a.companyId)!.country)).size > 1)).toBe(true);
    expect(persons.some((p) => p.appointments.some((a) => a.resigned) && currentAppointments(p).length)).toBe(true);
  });
  it('some persons are shareholders, PSCs or secretaries elsewhere, and some carry sample flags', () => {
    expect(persons.filter((p) => p.positions.some((x) => x.kind === 'Shareholder')).length).toBeGreaterThan(100);
    expect(persons.filter((p) => p.positions.some((x) => x.kind === 'PSC')).length).toBeGreaterThan(30);
    expect(persons.filter((p) => p.disqualified).length).toBeGreaterThan(0);
    const sh = persons.find((p) => p.positions.some((x) => x.kind === 'Shareholder'))!;
    const pos = sh.positions.find((x) => x.kind === 'Shareholder')!;
    expect(personIdFor(pos.companyId, sh.name)).toBe(sh.id);
  });
  it('gender and age based results are unchanged (calibration still holds)', () => {
    expect(run(DEMO_QUERY, getOriginalUk()).length).toBeGreaterThan(1850);
  });
});
