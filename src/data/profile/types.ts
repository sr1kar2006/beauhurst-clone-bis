import type { Stage } from '../taxonomies/misc';

/** Inline rich text: plain strings and purple links. */
export type Seg = string | { t: string; kind: 'person' | 'article' | 'filing' | 'investor' | 'company'; id?: string };

export type Degree = '1st' | '2nd' | null;

export interface Person {
  id: string;
  name: string;
  position: string;
  fn: string; // function
  email?: string;
  linkedin: boolean;
  degree: Degree;
  age?: number;
  appointed?: string;
  resigned?: string;
}

export type TimelineType =
  | 'News' | 'Person added' | 'Person removed' | 'Resolution' | 'Stage of evolution' | 'New fundraising'
  | 'Grant' | 'High growth list' | 'Accelerator' | 'Establishment' | 'Incorporation' | 'Capital' | 'Accounts';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineType;
  parts: Seg[];
  /** second line (fundraising valuation etc.) */
  sub?: Seg[];
  significant: boolean;
  stage: Stage;
  letter: 'F' | 'G' | 'E' | 'L' | 'A' | 'R' | 'C' | 'I' | null;
  detail?: [string, string][];
}

export type ActivityType =
  | 'News' | 'Person added' | 'Person removed' | 'Officers/Directors' | 'Capital' | 'Resolution' | 'Accounts/Financials'
  | 'Credit rating' | 'Fundraising valuation changed' | 'Fundraising amount added' | 'Fundraising source added';

export interface ActivityItem { id: string; added: string; type: ActivityType; parts: Seg[]; eventDate: string }

export interface Investor { name: string; country: string; hasProfile: boolean; managedBy?: string; followOn?: boolean }

export type TxType = 'fundraising' | 'grant' | 'mbo' | 'acquisition' | 'spinout';
export interface Transaction {
  id: string;
  type: TxType;
  label: string;
  stakePct?: number;
  investors: Investor[];
  undisclosed?: boolean;
  announced?: number;
  verified?: number;
  stage: Stage;
  date: string;
  preMoney?: number;
}

export interface Holding { shareholder: string; isPerson: boolean; shareClass: string; shares: number }
export interface OwnershipFiling { date: string; holdings: Holding[] }

export interface CorpNode { id: string; name: string; registeredName: string; country: string; consolidated: boolean; companyId?: string; current?: boolean; /** % held by the parent node */ pct?: number; children: CorpNode[] }

export interface HsItem { code: string; description: string; months: number; sub: { code: string; description: string; months: number }[] }
export interface Commodities {
  monthly: { month: string; imports: number; exports: number }[];
  imports: HsItem[];
  exports: HsItem[];
}

export type FinTableId = 'pl' | 'balance' | 'capital' | 'cashflow' | 'ratios' | 'misc';
export type FinValue = number | string | boolean | null;
export interface FinYear { yearEnd: string; values: Record<string, FinValue> }

export interface Filing { id: string; date: string; category: string; code: string; lead: string; rest: string; bullets?: string[] }
export interface NewsItem { id: string; headline: string; source: string; date: string; tagged: string[]; categories?: string[]; url?: string }
export interface Patent { title: string; applicationNo: string; filed: string; status: string; jurisdiction: string }
export interface Charge { created: string; delivered: string; status: string; entitled: string; description: string }

export interface CompanyProfile {
  id: string;
  tradingName: string;
  registeredName: string;
  legalForm: string;
  smeStatus: 'SME' | 'Large';
  incorporationDate: string;
  altEstablishmentDate: string;
  otherTradingNames: string[];
  descriptionOwnWords: string;
  sectors: string[];
  technology: { category: string; items: string[] }[];
  contact: { website?: string; phone?: string; emails: string[]; socials: string[]; appStores: string[] };
  addresses: { headOffice: string[]; registered: string[]; trading: string[][] };
  locationHierarchy: { value: string; type: string }[];
  covidStatus: string;
  activelyHiring: boolean;
  accelerators: { name: string; start: string; end: string }[];
  highGrowthLists: { name: string; cohort: string; announced: string }[];
  stagePeriods: { stage: Stage; from: string }[];
  credit: { rating: string; limit: number; updated: string; auditors: string; seniorAuditor: string; accountsDate: string; accountType: string };
  connections: { first: number; second: number };

  timeline: TimelineEvent[];
  activity: ActivityItem[];
  transactions: Transaction[];
  people: { keyPeople: Person[]; directors: Person[]; secretaries: Person[]; previousKeyPeople: Person[]; previousDirectors: Person[]; psc: Person[] };
  ownership: { filings: OwnershipFiling[]; pricePerShare: number };
  corporateTree: CorpNode;
  commodities: Commodities | null;
  financials: FinYear[];
  filings: Filing[];
  news: NewsItem[];
  patents: Patent[];
  charges: Charge[];
}
