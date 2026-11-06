import { COMPANY_COUNT, DATA_SEED } from '../config';
import { generateCompanies, generateSecondary } from './generate';
import { lumenCompanies } from './fixtures/lumen-bank';
import type { Company, Entity } from './types';

let companies: Company[] | null = null;
let de: Company[] | null = null;
let funds: Company[] | null = null;
let byId: Map<string, Company> | null = null;

/** 5,000 generated companies plus the two hand-built demo fixtures (Lumen Bank and its group). */
export function getCompanies(): Company[] {
  if (!companies) companies = [...lumenCompanies(), ...generateCompanies(COMPANY_COUNT, DATA_SEED)];
  return companies;
}

export function getDataset(entity: Entity): Company[] {
  if (entity === 'de') return (de ??= generateSecondary('de', 400, DATA_SEED + 1));
  if (entity === 'funds') return (funds ??= generateSecondary('funds', 250, DATA_SEED + 2));
  return getCompanies();
}

export function getCompany(id: string): Company | undefined {
  if (!byId) {
    byId = new Map();
    for (const e of ['companies', 'de', 'funds'] as Entity[]) getDataset(e).forEach((c) => byId!.set(c.id, c));
  }
  return byId.get(id);
}
