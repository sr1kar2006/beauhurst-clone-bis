import type { Region, Stage, Tracking } from './taxonomies/misc';

export type Gender = 'Male' | 'Female' | 'Unknown';

export interface Fundraising {
  date: string; // ISO
  amount: number;
  stage: 'Seed' | 'Venture' | 'Growth';
  investors: string[];
}
export interface Director {
  name: string;
  gender: Gender;
  birthYear: number;
  appointed: string;
  resigned?: string;
}
export interface CompanyEvent { type: string; date: string }

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  businessDescription: string;
  /** taxonomy item ids (both industries and buzzwords) */
  industries: string[];
  headOffice: Region;
  lat: number;
  lng: number;
  companiesHouseId: string;
  chStatus: string;
  stage: Stage;
  trackingStatus: Tracking;
  signals: string[];
  foundedDate: string;
  ceasedDate?: string;
  fundraisingTotal: number;
  latestFundraisingDate?: string;
  fundraisings: Fundraising[];
  turnover?: number;
  hasFullFinancials: boolean;
  netAssets?: number;
  employees?: number;
  directors: Director[];
  founders: { name: string; gender: Gender }[];
  shareholders: string[];
  events: CompanyEvent[];
  website?: string;
  socials: string[];
  companyType: string;
  legalForm: string;
  isSubsidiary: boolean;
  targetMarkets: string[];
  imports: boolean;
  exports: boolean;
  sicCodes: string[];
  collectionIds?: never;
  seniorHires: number;
}

export type Entity = 'companies' | 'de' | 'funds';
