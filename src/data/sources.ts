/**
 * Data sources and methodology (spec 3.2). Real public registries appear as NAMED EXAMPLES of where such data
 * comes from; partners are generic placeholders. Every timing / depth value comes from config/tender.ts and is
 * tagged "Sample" in the UI. Nothing here is a commitment about the real service.
 */
import { coverageFor, DATASETS, type DatasetId, type TenderValue, type Coverage } from '../config/tender';

export type SourceType = 'official registry' | 'regulatory filings' | 'market data' | 'news' | 'in-house research' | 'third-party partner';

export interface DataSource {
  id: string;
  name: string;
  type: SourceType;
  jurisdictions: string[]; // ISO-2, or '*' for global
  url?: string;
  licence: string;
  datasetsCovered: DatasetId[];
  qaProcess: string;
  knownLimitations: string[];
  correctionProcess: string;
}

export const SOURCES: DataSource[] = [
  {
    id: 'companies-house', name: 'Companies House', type: 'official registry', jurisdictions: ['GB'], url: 'https://find-and-update.company-information.service.gov.uk',
    licence: 'Open Government Licence v3.0 (public register data)', datasetsCovered: ['company-details', 'officers', 'ownership', 'accounts', 'filings'],
    qaProcess: 'Daily bulk and streaming ingest; schema and identifier validation; officer and PSC de-duplication against our persons index.',
    knownLimitations: ['Small and micro companies file abridged accounts without a profit and loss account.', 'Officer dates of birth are month and year only.', 'PSC data starts in 2016.'],
    correctionProcess: 'Errors in the register itself are referred to Companies House; matching or enrichment errors are corrected by our team.',
  },
  {
    id: 'cro', name: 'Companies Registration Office (Ireland)', type: 'official registry', jurisdictions: ['IE'], url: 'https://cro.ie',
    licence: 'CRO open data and search services (terms apply)', datasetsCovered: ['company-details', 'officers', 'accounts', 'filings'],
    qaProcess: 'Daily ingest of new submissions; B1 annual returns parsed for financial statements; officer matching.',
    knownLimitations: ['Beneficial ownership (RBO) access is restricted; ownership relies on filings and partner data.', 'Many small companies file abridged financial statements.'],
    correctionProcess: 'Register errors referred to the CRO; our errors corrected within the target turnaround.',
  },
  {
    id: 'sec-edgar', name: 'SEC EDGAR', type: 'regulatory filings', jurisdictions: ['US'], url: 'https://www.sec.gov/edgar',
    licence: 'Public domain (US federal government works)', datasetsCovered: ['accounts', 'filings', 'officers', 'ownership'],
    qaProcess: 'XBRL financial data validated against reported totals; 8-K officer changes parsed and reviewed.',
    knownLimitations: ['Only SEC registrants (mostly listed companies) file here; private US companies rely on state registries and partners.'],
    correctionProcess: 'Restated filings supersede earlier values automatically; parsing errors corrected by our team.',
  },
  {
    id: 'handelsregister', name: 'Handelsregister (Germany)', type: 'official registry', jurisdictions: ['DE'], url: 'https://www.handelsregister.de',
    licence: 'Public register; documents subject to register terms', datasetsCovered: ['company-details', 'officers', 'filings'],
    qaProcess: 'Register notices parsed; Geschäftsführer changes matched to persons; manual review of ambiguous entries.',
    knownLimitations: ['Annual accounts are published separately (Unternehmensregister) and can lag by over 12 months.', 'Shareholder lists are documents, not structured data.'],
    correctionProcess: 'Register errors referred to the local court register; our errors corrected by our team.',
  },
  {
    id: 'infogreffe', name: 'Infogreffe (France)', type: 'official registry', jurisdictions: ['FR'], url: 'https://www.infogreffe.fr',
    licence: 'Licensed register data (terms apply)', datasetsCovered: ['company-details', 'officers', 'accounts', 'filings'],
    qaProcess: 'SIREN-level matching; dirigeant changes reviewed; accounts confidentiality flags respected.',
    knownLimitations: ['Small companies may opt for confidential accounts, so turnover may be missing.'],
    correctionProcess: 'Register errors referred to the greffe; our errors corrected by our team.',
  },
  {
    id: 'kvk', name: 'KVK Business Register (Netherlands)', type: 'official registry', jurisdictions: ['NL'], url: 'https://www.kvk.nl',
    licence: 'Licensed register data (terms apply)', datasetsCovered: ['company-details', 'officers', 'accounts'],
    qaProcess: 'KVK number validation; bestuurder changes matched to persons.',
    knownLimitations: ['UBO register access is restricted.'],
    correctionProcess: 'Register errors referred to KVK; our errors corrected by our team.',
  },
  {
    id: 'bolagsverket', name: 'Bolagsverket (Sweden)', type: 'official registry', jurisdictions: ['SE'], url: 'https://bolagsverket.se',
    licence: 'Licensed register data (terms apply)', datasetsCovered: ['company-details', 'officers', 'accounts', 'filings'],
    qaProcess: 'Organisationsnummer validation; annual report figures checked against totals.',
    knownLimitations: ['Some historic annual reports are scanned images only.'],
    correctionProcess: 'Register errors referred to Bolagsverket; our errors corrected by our team.',
  },
  {
    id: 'gleif', name: 'GLEIF LEI register', type: 'official registry', jurisdictions: ['*'], url: 'https://www.gleif.org',
    licence: 'CC0 1.0 (Global LEI data)', datasetsCovered: ['company-details', 'ownership'],
    qaProcess: 'LEI records matched to registry entities; Level 2 parent relationships used for corporate structure.',
    knownLimitations: ['Only entities that have obtained an LEI are covered; parent data is self-reported.'],
    correctionProcess: 'LEI data challenges raised with the issuing LOU via GLEIF.',
  },
  {
    id: 'national-registers', name: 'National business registers via partner (sample)', type: 'third-party partner', jurisdictions: ['ES', 'IT', 'DK', 'NO', 'FI', 'CH', 'BE', 'AT', 'PL', 'PT', 'IN', 'SG', 'JP', 'AU', 'CA', 'AE', 'IL', 'BR', 'ZA', 'HK', 'NZ'],
    licence: 'Commercial licence from an international data partner (sample)', datasetsCovered: ['company-details', 'officers', 'ownership', 'accounts', 'filings'],
    qaProcess: 'Partner data mapped to a common schema; country-specific identifiers validated; filing vocabulary mapped per jurisdiction.',
    knownLimitations: ['Depth and timeliness vary by country (see the coverage matrix).', 'Financials for private companies are not public in every jurisdiction.'],
    correctionProcess: 'Partner errors raised with the partner under the data licence; mapping errors corrected by our team.',
  },
  {
    id: 'lse-rns', name: 'London Stock Exchange RNS', type: 'market data', jurisdictions: ['GB', 'IE'], url: 'https://www.londonstockexchange.com/news',
    licence: 'Licensed regulatory news feed (terms apply)', datasetsCovered: ['news', 'filings'],
    qaProcess: 'Announcements classified by category and linked to issuers by ISIN and ticker.',
    knownLimitations: ['Covers listed issuers only.'],
    correctionProcess: 'Misclassified announcements re-tagged by our team.',
  },
  {
    id: 'credit-partner', name: 'Credit reference partner (sample)', type: 'third-party partner', jurisdictions: ['*'],
    licence: 'Commercial licence (sample)', datasetsCovered: ['credit'],
    qaProcess: 'Scores and limits refreshed weekly; large movements flagged for review.',
    knownLimitations: ['Ratings are modelled estimates, not guarantees.', 'Coverage outside the UK and Ireland is thinner.'],
    correctionProcess: 'Disputes passed to the partner; response within the partner SLA.',
  },
  {
    id: 'news-partner', name: 'News aggregation partner (sample)', type: 'news', jurisdictions: ['*'],
    licence: 'Commercial licence (sample)', datasetsCovered: ['news'],
    qaProcess: 'Entity recognition links articles to companies; low-confidence links reviewed by an analyst.',
    knownLimitations: ['Some publishers are paywalled; we show headline, source and link only.'],
    correctionProcess: 'Wrongly tagged articles untagged by our team.',
  },
  {
    id: 'in-house', name: 'In-house research team', type: 'in-house research', jurisdictions: ['*'],
    licence: 'Proprietary', datasetsCovered: ['fundraisings', 'trade', 'company-details'],
    qaProcess: 'Fundraisings verified against filings (allotments) and announcements; two-person review for amounts over £10m.',
    knownLimitations: ['Undisclosed rounds are estimated and marked as such.'],
    correctionProcess: 'Corrections made directly by the research team.',
  },
];

export const SOURCE_BY_ID: Record<string, DataSource> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

const REGISTRY_BY_COUNTRY: Record<string, string> = { GB: 'companies-house', IE: 'cro', US: 'sec-edgar', DE: 'handelsregister', FR: 'infogreffe', NL: 'kvk', SE: 'bolagsverket' };
/** The primary registry source for a country. */
export const registrySource = (country: string) => SOURCE_BY_ID[REGISTRY_BY_COUNTRY[country] ?? 'national-registers'];

/** Which source backs a dataset for a company in a given country. */
export function sourceFor(dataset: DatasetId, country: string): DataSource {
  switch (dataset) {
    case 'credit': return SOURCE_BY_ID['credit-partner'];
    case 'news': return SOURCE_BY_ID['news-partner'];
    case 'fundraisings': case 'trade': return SOURCE_BY_ID['in-house'];
    case 'ownership': return country === 'GB' || country === 'US' ? registrySource(country) : SOURCE_BY_ID.gleif;
    default: return registrySource(country);
  }
}

/** Coverage for a source: its primary jurisdiction and first dataset (for the source card). */
export function sourceCoverage(s: DataSource): TenderValue<Coverage> {
  const j = s.jurisdictions[0] === '*' ? 'GB' : s.jurisdictions[0];
  return coverageFor(s.datasetsCovered[0], j);
}

export const datasetLabel = (id: DatasetId) => DATASETS.find((d) => d.id === id)?.label ?? id;

export const QA_STEPS = [
  { id: 'ingest', label: 'Ingest', checks: ['Scheduled pulls and streaming feeds from each source', 'Raw files archived with a checksum and retrieval time', 'Volume checks against the previous run'] },
  { id: 'validate', label: 'Validate', checks: ['Schema and mandatory fields', 'Identifier formats per jurisdiction (e.g. company number, SIREN, CIK)', 'Accounts totals reconcile (assets = liabilities + equity)'] },
  { id: 'match', label: 'Match & de-duplicate', checks: ['Entity resolution across sources by identifier, name and address', 'Persons index: same person across companies', 'Duplicates merged with full lineage kept'] },
  { id: 'enrich', label: 'Enrich', checks: ['Industry and signal classification', 'Currency conversion with dated FX', 'Corporate structure and ultimate owner derivation'] },
  { id: 'review', label: 'Human review', checks: ['Low-confidence matches and large value changes queued for analysts', 'Weekly sampled audit', 'Fundraisings above a threshold double-checked'] },
  { id: 'publish', label: 'Publish', checks: ['Versioned release with field-level provenance', 'Availability timestamp recorded per record', 'Monitoring alerts triggered for watched companies'] },
] as const;

/** Per-jurisdiction limitations shown on the Limitations tab. */
export const JURISDICTION_LIMITS: { country: string; text: string }[] = [
  { country: 'GB', text: 'Abridged and micro-entity accounts omit turnover; PSC data from 2016 only.' },
  { country: 'IE', text: 'Register of Beneficial Ownership access is restricted; ownership is derived from filings.' },
  { country: 'US', text: 'Private companies file little public data; coverage leans on state registries and partners.' },
  { country: 'DE', text: 'Accounts are published with a long lag and often in abridged form.' },
  { country: 'FR', text: 'Small companies can keep their accounts confidential.' },
  { country: 'JP', text: 'Register extracts are in Japanese; names are romanised by our partner.' },
];
