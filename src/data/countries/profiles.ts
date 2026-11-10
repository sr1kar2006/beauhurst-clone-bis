import type { Rng } from '../rng';

/**
 * Country profiles for the seeded jurisdictions: registry, identifiers, legal forms, filing vocabulary,
 * location hierarchy, currency and stock exchange. Registry names are real public registries used as
 * named examples; every company and identifier generated from them is fictional.
 */
export interface LegalForm { form: string; type: string; weight: number; listedOnly?: boolean }
export interface RegionDef { name: string; lat: number; lng: number; w: number; city: string }
export interface FilingVocab {
  accounts: [string, string];
  confirmation: [string, string];
  appoint: [string, string];
  resign: [string, string];
  capital: [string, string];
  incorporation: [string, string];
  charge: [string, string];
  resolution: [string, string];
}
export interface CountryProfile {
  code: string;
  currency: string;
  symbol: string;
  registry: { name: string; short: string; idLabel: string; id: (r: Rng) => string };
  legalForms: LegalForm[];
  regions: RegionDef[];
  exchanges: { name: string; code: string }[];
  tld: string;
  filings: FilingVocab;
  /** Local word for an active company on the register. */
  activeLabel: string;
  /** count in the generated dataset */
  count: number;
}

const digits = (r: Rng, n: number) => Array.from({ length: n }, () => r.int(0, 9)).join('');
const reg = (name: string, lat: number, lng: number, w = 1, city = name): RegionDef => ({ name, lat, lng, w, city });

const EU_FILINGS = (accounts: string, confirmation: string, officers: string, capital: string, inc: string): FilingVocab => ({
  accounts: [accounts, 'Annual financial statements'],
  confirmation: [confirmation, 'Annual return / confirmation of register details'],
  appoint: [officers, 'Appointment of a director / managing director'],
  resign: [officers, 'Resignation of a director / managing director'],
  capital: [capital, 'Change in share capital'],
  incorporation: [inc, 'Registration of the company'],
  charge: ['CHG', 'Registration of a security interest'],
  resolution: ['RES', 'Shareholder resolution'],
});

export const COUNTRY_PROFILES: CountryProfile[] = [
  {
    code: 'GB', currency: 'GBP', symbol: '£', count: 6000, tld: 'co.uk', activeLabel: 'Active',
    registry: { name: 'Companies House', short: 'CH', idLabel: 'Company number', id: (r) => digits(r, 8) },
    legalForms: [{ form: 'Ltd', type: 'Private limited company', weight: 90 }, { form: 'PLC', type: 'Public limited company', weight: 2, listedOnly: true }, { form: 'LLP', type: 'Limited liability partnership', weight: 5 }, { form: 'CIC', type: 'Community interest company', weight: 3 }],
    regions: [reg('London', 51.507, -0.128, 42)],
    exchanges: [{ name: 'London Stock Exchange', code: 'LSE' }, { name: 'AIM', code: 'AIM' }],
    filings: {
      accounts: ['AA', 'Full accounts'], confirmation: ['CS01', 'Confirmation statement'], appoint: ['AP01', 'Appointment of director'],
      resign: ['TM01', 'Termination of appointment of director'], capital: ['SH01', 'Return of allotment of shares'], incorporation: ['IN01', 'Incorporation'],
      charge: ['MR01', 'Registration of a charge'], resolution: ['RESOLUTIONS', 'Resolutions'],
    },
  },
  {
    code: 'IE', currency: 'EUR', symbol: '€', count: 1800, tld: 'ie', activeLabel: 'Normal',
    registry: { name: 'Companies Registration Office', short: 'CRO', idLabel: 'CRO number', id: (r) => String(r.int(100000, 799999)) },
    legalForms: [{ form: 'Limited', type: 'Private company limited by shares (LTD)', weight: 82 }, { form: 'DAC', type: 'Designated activity company', weight: 9 }, { form: 'PLC', type: 'Public limited company', weight: 3, listedOnly: true }, { form: 'CLG', type: 'Company limited by guarantee', weight: 6 }],
    regions: [reg('Dublin', 53.35, -6.26, 55), reg('Cork', 51.9, -8.47, 14), reg('Galway', 53.27, -9.05, 8), reg('Limerick', 52.66, -8.63, 7), reg('Waterford', 52.26, -7.11, 4), reg('Kildare', 53.16, -6.91, 6, 'Naas'), reg('Westmeath', 53.53, -7.35, 3, 'Athlone'), reg('Donegal', 54.65, -8.11, 3, 'Letterkenny')],
    exchanges: [{ name: 'Euronext Dublin', code: 'ISE' }],
    filings: {
      accounts: ['B1', 'Annual return with financial statements'], confirmation: ['B1', 'Annual return'], appoint: ['B10', 'Change of director or secretary'],
      resign: ['B10', 'Change of director or secretary'], capital: ['B5', 'Return of allotments'], incorporation: ['A1', 'Incorporation'],
      charge: ['C1', 'Particulars of a charge'], resolution: ['G1', 'Special resolution'],
    },
  },
  {
    code: 'US', currency: 'USD', symbol: '$', count: 700, tld: 'com', activeLabel: 'Active / Good standing',
    registry: { name: 'SEC EDGAR / Delaware Division of Corporations', short: 'SEC', idLabel: 'EIN', id: (r) => `${digits(r, 2)}-${digits(r, 7)}` },
    legalForms: [{ form: 'Inc.', type: 'C corporation', weight: 70 }, { form: 'LLC', type: 'Limited liability company', weight: 25 }, { form: 'Corp.', type: 'Public corporation', weight: 5, listedOnly: true }],
    regions: [reg('California', 37.77, -122.42, 30, 'San Francisco'), reg('New York', 40.71, -74.0, 22, 'New York'), reg('Massachusetts', 42.36, -71.06, 10, 'Boston'), reg('Texas', 30.27, -97.74, 12, 'Austin'), reg('Washington', 47.61, -122.33, 8, 'Seattle'), reg('Illinois', 41.88, -87.63, 6, 'Chicago'), reg('Delaware', 39.74, -75.55, 5, 'Wilmington'), reg('Florida', 25.76, -80.19, 7, 'Miami')],
    exchanges: [{ name: 'Nasdaq', code: 'NASDAQ' }, { name: 'New York Stock Exchange', code: 'NYSE' }],
    filings: {
      accounts: ['10-K', 'Annual report'], confirmation: ['AR', 'Annual franchise tax report'], appoint: ['8-K', 'Current report: officer appointment'],
      resign: ['8-K', 'Current report: officer departure'], capital: ['S-1', 'Registration statement'], incorporation: ['COI', 'Certificate of incorporation'],
      charge: ['UCC-1', 'Financing statement'], resolution: ['DEF 14A', 'Proxy statement'],
    },
  },
  {
    code: 'DE', currency: 'EUR', symbol: '€', count: 420, tld: 'de', activeLabel: 'aktiv',
    registry: { name: 'Handelsregister', short: 'HR', idLabel: 'Register number', id: (r) => `HRB ${r.int(10000, 299999)}` },
    legalForms: [{ form: 'GmbH', type: 'Gesellschaft mit beschränkter Haftung', weight: 80 }, { form: 'UG', type: 'Unternehmergesellschaft (haftungsbeschränkt)', weight: 10 }, { form: 'AG', type: 'Aktiengesellschaft', weight: 6, listedOnly: true }, { form: 'GmbH & Co. KG', type: 'Kommanditgesellschaft', weight: 4 }],
    regions: [reg('Berlin', 52.52, 13.4, 28), reg('Bayern', 48.14, 11.58, 22, 'München'), reg('Hamburg', 53.55, 10, 12), reg('Hessen', 50.11, 8.68, 10, 'Frankfurt am Main'), reg('Nordrhein-Westfalen', 51.23, 6.78, 14, 'Düsseldorf'), reg('Baden-Württemberg', 48.78, 9.18, 10, 'Stuttgart'), reg('Sachsen', 51.05, 13.74, 4, 'Dresden')],
    exchanges: [{ name: 'Xetra', code: 'XETRA' }, { name: 'Börse Frankfurt', code: 'FWB' }],
    filings: EU_FILINGS('Jahresabschluss', 'Gesellschafterliste', 'Geschäftsführerwechsel', 'Kapitalerhöhung', 'Ersteintragung'),
  },
  {
    code: 'FR', currency: 'EUR', symbol: '€', count: 380, tld: 'fr', activeLabel: 'Actif',
    registry: { name: 'Infogreffe (RCS)', short: 'RCS', idLabel: 'SIREN', id: (r) => `${digits(r, 3)} ${digits(r, 3)} ${digits(r, 3)}` },
    legalForms: [{ form: 'SAS', type: 'Société par actions simplifiée', weight: 70 }, { form: 'SARL', type: 'Société à responsabilité limitée', weight: 22 }, { form: 'SA', type: 'Société anonyme', weight: 8, listedOnly: true }],
    regions: [reg('Île-de-France', 48.86, 2.35, 55, 'Paris'), reg('Auvergne-Rhône-Alpes', 45.76, 4.84, 14, 'Lyon'), reg("Provence-Alpes-Côte d'Azur", 43.3, 5.37, 9, 'Marseille'), reg('Occitanie', 43.6, 1.44, 9, 'Toulouse'), reg('Nouvelle-Aquitaine', 44.84, -0.58, 7, 'Bordeaux'), reg('Hauts-de-France', 50.63, 3.06, 6, 'Lille')],
    exchanges: [{ name: 'Euronext Paris', code: 'EPA' }],
    filings: EU_FILINGS('Comptes annuels', 'Déclaration des bénéficiaires effectifs', 'Changement de dirigeant', 'Augmentation de capital', 'Immatriculation'),
  },
  {
    code: 'NL', currency: 'EUR', symbol: '€', count: 240, tld: 'nl', activeLabel: 'Actief',
    registry: { name: 'Kamer van Koophandel (KVK)', short: 'KVK', idLabel: 'KVK number', id: (r) => digits(r, 8) },
    legalForms: [{ form: 'B.V.', type: 'Besloten vennootschap', weight: 92 }, { form: 'N.V.', type: 'Naamloze vennootschap', weight: 8, listedOnly: true }],
    regions: [reg('Noord-Holland', 52.37, 4.9, 45, 'Amsterdam'), reg('Zuid-Holland', 51.92, 4.48, 25, 'Rotterdam'), reg('Utrecht', 52.09, 5.12, 14), reg('Noord-Brabant', 51.44, 5.48, 16, 'Eindhoven')],
    exchanges: [{ name: 'Euronext Amsterdam', code: 'AMS' }],
    filings: EU_FILINGS('Jaarrekening', 'Uittreksel UBO-register', 'Wijziging bestuurder', 'Kapitaalwijziging', 'Inschrijving'),
  },
  {
    code: 'ES', currency: 'EUR', symbol: '€', count: 200, tld: 'es', activeLabel: 'Activa',
    registry: { name: 'Registro Mercantil Central', short: 'RMC', idLabel: 'NIF', id: (r) => `B${digits(r, 8)}` },
    legalForms: [{ form: 'S.L.', type: 'Sociedad limitada', weight: 90 }, { form: 'S.A.', type: 'Sociedad anónima', weight: 10, listedOnly: true }],
    regions: [reg('Madrid', 40.42, -3.7, 45), reg('Cataluña', 41.39, 2.17, 35, 'Barcelona'), reg('Comunidad Valenciana', 39.47, -0.38, 12, 'Valencia'), reg('Andalucía', 37.39, -5.98, 8, 'Sevilla')],
    exchanges: [{ name: 'Bolsa de Madrid', code: 'BME' }],
    filings: EU_FILINGS('Cuentas anuales', 'Depósito de cuentas', 'Nombramiento de administrador', 'Ampliación de capital', 'Constitución'),
  },
  {
    code: 'IT', currency: 'EUR', symbol: '€', count: 180, tld: 'it', activeLabel: 'Attiva',
    registry: { name: 'Registro delle Imprese', short: 'REA', idLabel: 'Codice fiscale', id: (r) => digits(r, 11) },
    legalForms: [{ form: 'S.r.l.', type: 'Società a responsabilità limitata', weight: 88 }, { form: 'S.p.A.', type: 'Società per azioni', weight: 12, listedOnly: true }],
    regions: [reg('Lombardia', 45.46, 9.19, 45, 'Milano'), reg('Lazio', 41.9, 12.5, 25, 'Roma'), reg('Piemonte', 45.07, 7.69, 15, 'Torino'), reg('Emilia-Romagna', 44.49, 11.34, 15, 'Bologna')],
    exchanges: [{ name: 'Euronext Milan', code: 'BIT' }],
    filings: EU_FILINGS('Bilancio d’esercizio', 'Elenco soci', 'Nomina amministratore', 'Aumento di capitale', 'Iscrizione'),
  },
  {
    code: 'SE', currency: 'SEK', symbol: 'kr', count: 200, tld: 'se', activeLabel: 'Aktivt',
    registry: { name: 'Bolagsverket', short: 'BV', idLabel: 'Organisationsnummer', id: (r) => `559${digits(r, 3)}-${digits(r, 4)}` },
    legalForms: [{ form: 'AB', type: 'Aktiebolag (privat)', weight: 92 }, { form: 'AB (publ)', type: 'Aktiebolag (publikt)', weight: 8, listedOnly: true }],
    regions: [reg('Stockholm', 59.33, 18.07, 60), reg('Västra Götaland', 57.71, 11.97, 22, 'Göteborg'), reg('Skåne', 55.6, 13.0, 18, 'Malmö')],
    exchanges: [{ name: 'Nasdaq Stockholm', code: 'STO' }],
    filings: EU_FILINGS('Årsredovisning', 'Ändring av styrelse', 'Ändring av styrelse', 'Nyemission', 'Registrering'),
  },
  {
    code: 'DK', currency: 'DKK', symbol: 'kr', count: 110, tld: 'dk', activeLabel: 'Normal',
    registry: { name: 'Erhvervsstyrelsen (CVR)', short: 'CVR', idLabel: 'CVR number', id: (r) => digits(r, 8) },
    legalForms: [{ form: 'ApS', type: 'Anpartsselskab', weight: 90 }, { form: 'A/S', type: 'Aktieselskab', weight: 10, listedOnly: true }],
    regions: [reg('Hovedstaden', 55.68, 12.57, 65, 'København'), reg('Midtjylland', 56.16, 10.2, 25, 'Aarhus'), reg('Syddanmark', 55.4, 10.39, 10, 'Odense')],
    exchanges: [{ name: 'Nasdaq Copenhagen', code: 'CPH' }],
    filings: EU_FILINGS('Årsrapport', 'Ejerregister', 'Ændring af direktion', 'Kapitalforhøjelse', 'Stiftelse'),
  },
  {
    code: 'NO', currency: 'NOK', symbol: 'kr', count: 100, tld: 'no', activeLabel: 'Aktiv',
    registry: { name: 'Brønnøysundregistrene', short: 'BRREG', idLabel: 'Organisasjonsnummer', id: (r) => `9${digits(r, 8)}` },
    legalForms: [{ form: 'AS', type: 'Aksjeselskap', weight: 92 }, { form: 'ASA', type: 'Allmennaksjeselskap', weight: 8, listedOnly: true }],
    regions: [reg('Oslo', 59.91, 10.75, 60), reg('Vestland', 60.39, 5.32, 22, 'Bergen'), reg('Trøndelag', 63.43, 10.39, 18, 'Trondheim')],
    exchanges: [{ name: 'Oslo Børs', code: 'OSE' }],
    filings: EU_FILINGS('Årsregnskap', 'Aksjonærregister', 'Endring i styret', 'Kapitalforhøyelse', 'Stiftelse'),
  },
  {
    code: 'FI', currency: 'EUR', symbol: '€', count: 100, tld: 'fi', activeLabel: 'Aktiivinen',
    registry: { name: 'Patentti- ja rekisterihallitus (PRH)', short: 'PRH', idLabel: 'Business ID (Y-tunnus)', id: (r) => `${digits(r, 7)}-${r.int(0, 9)}` },
    legalForms: [{ form: 'Oy', type: 'Osakeyhtiö', weight: 92 }, { form: 'Oyj', type: 'Julkinen osakeyhtiö', weight: 8, listedOnly: true }],
    regions: [reg('Uusimaa', 60.17, 24.94, 65, 'Helsinki'), reg('Pirkanmaa', 61.5, 23.76, 20, 'Tampere'), reg('Varsinais-Suomi', 60.45, 22.27, 15, 'Turku')],
    exchanges: [{ name: 'Nasdaq Helsinki', code: 'HEL' }],
    filings: EU_FILINGS('Tilinpäätös', 'Muutosilmoitus', 'Hallituksen muutos', 'Osakeanti', 'Perustamisilmoitus'),
  },
  {
    code: 'CH', currency: 'CHF', symbol: 'CHF ', count: 150, tld: 'ch', activeLabel: 'Aktiv',
    registry: { name: 'Zefix (Swiss commercial register)', short: 'ZEFIX', idLabel: 'UID', id: (r) => `CHE-${digits(r, 3)}.${digits(r, 3)}.${digits(r, 3)}` },
    legalForms: [{ form: 'AG', type: 'Aktiengesellschaft', weight: 55 }, { form: 'GmbH', type: 'Gesellschaft mit beschränkter Haftung', weight: 45 }],
    regions: [reg('Zürich', 47.37, 8.54, 50), reg('Genève', 46.2, 6.14, 20), reg('Basel-Stadt', 47.56, 7.59, 15, 'Basel'), reg('Vaud', 46.52, 6.63, 15, 'Lausanne')],
    exchanges: [{ name: 'SIX Swiss Exchange', code: 'SIX' }],
    filings: EU_FILINGS('Jahresrechnung', 'SHAB-Publikation', 'Mutation Verwaltungsrat', 'Kapitalerhöhung', 'Neueintragung'),
  },
  {
    code: 'BE', currency: 'EUR', symbol: '€', count: 110, tld: 'be', activeLabel: 'Actif',
    registry: { name: 'Banque-Carrefour des Entreprises (KBO/BCE)', short: 'BCE', idLabel: 'Enterprise number', id: (r) => `0${digits(r, 3)}.${digits(r, 3)}.${digits(r, 3)}` },
    legalForms: [{ form: 'BV', type: 'Besloten vennootschap / SRL', weight: 85 }, { form: 'NV', type: 'Naamloze vennootschap / SA', weight: 15, listedOnly: true }],
    regions: [reg('Brussels-Capital', 50.85, 4.35, 45, 'Brussels'), reg('Flanders', 51.05, 3.72, 40, 'Ghent'), reg('Wallonia', 50.63, 5.57, 15, 'Liège')],
    exchanges: [{ name: 'Euronext Brussels', code: 'EBR' }],
    filings: EU_FILINGS('Jaarrekening (NBB)', 'UBO-register', 'Benoeming bestuurder', 'Kapitaalverhoging', 'Oprichting'),
  },
  {
    code: 'AT', currency: 'EUR', symbol: '€', count: 100, tld: 'at', activeLabel: 'aktiv',
    registry: { name: 'Firmenbuch', short: 'FB', idLabel: 'Firmenbuchnummer', id: (r) => `FN ${r.int(100000, 599999)}${'abcdhikmpstvwxyz'[r.int(0, 15)]}` },
    legalForms: [{ form: 'GmbH', type: 'Gesellschaft mit beschränkter Haftung', weight: 90 }, { form: 'AG', type: 'Aktiengesellschaft', weight: 10, listedOnly: true }],
    regions: [reg('Wien', 48.21, 16.37, 60), reg('Steiermark', 47.07, 15.44, 20, 'Graz'), reg('Oberösterreich', 48.31, 14.29, 20, 'Linz')],
    exchanges: [{ name: 'Wiener Börse', code: 'VIE' }],
    filings: EU_FILINGS('Jahresabschluss', 'Gesellschafterwechsel', 'Geschäftsführerwechsel', 'Kapitalerhöhung', 'Neueintragung'),
  },
  {
    code: 'PL', currency: 'PLN', symbol: 'zł ', count: 120, tld: 'pl', activeLabel: 'Aktywny',
    registry: { name: 'Krajowy Rejestr Sądowy (KRS)', short: 'KRS', idLabel: 'KRS number', id: (r) => `0000${digits(r, 6)}` },
    legalForms: [{ form: 'sp. z o.o.', type: 'Spółka z ograniczoną odpowiedzialnością', weight: 90 }, { form: 'S.A.', type: 'Spółka akcyjna', weight: 10, listedOnly: true }],
    regions: [reg('Mazowieckie', 52.23, 21.01, 50, 'Warszawa'), reg('Małopolskie', 50.06, 19.94, 25, 'Kraków'), reg('Dolnośląskie', 51.11, 17.03, 25, 'Wrocław')],
    exchanges: [{ name: 'Warsaw Stock Exchange', code: 'WSE' }],
    filings: EU_FILINGS('Sprawozdanie finansowe', 'Lista wspólników', 'Zmiana zarządu', 'Podwyższenie kapitału', 'Wpis do rejestru'),
  },
  {
    code: 'PT', currency: 'EUR', symbol: '€', count: 90, tld: 'pt', activeLabel: 'Ativa',
    registry: { name: 'Registo Comercial', short: 'RC', idLabel: 'NIPC', id: (r) => `5${digits(r, 8)}` },
    legalForms: [{ form: 'Lda.', type: 'Sociedade por quotas', weight: 88 }, { form: 'S.A.', type: 'Sociedade anónima', weight: 12, listedOnly: true }],
    regions: [reg('Lisboa', 38.72, -9.14, 60), reg('Porto', 41.15, -8.61, 40)],
    exchanges: [{ name: 'Euronext Lisbon', code: 'ELI' }],
    filings: EU_FILINGS('Prestação de contas', 'Registo do beneficiário efetivo', 'Designação de gerente', 'Aumento de capital', 'Constituição'),
  },
  {
    code: 'IN', currency: 'INR', symbol: '₹', count: 220, tld: 'in', activeLabel: 'Active',
    registry: { name: 'Ministry of Corporate Affairs (MCA21)', short: 'MCA', idLabel: 'CIN', id: (r) => `U${digits(r, 5)}KA${r.int(2005, 2023)}PTC${digits(r, 6)}` },
    legalForms: [{ form: 'Private Limited', type: 'Private limited company', weight: 88 }, { form: 'Limited', type: 'Public limited company', weight: 12, listedOnly: true }],
    regions: [reg('Karnataka', 12.97, 77.59, 35, 'Bengaluru'), reg('Maharashtra', 19.08, 72.88, 30, 'Mumbai'), reg('Delhi', 28.61, 77.21, 20, 'New Delhi'), reg('Telangana', 17.39, 78.49, 15, 'Hyderabad')],
    exchanges: [{ name: 'National Stock Exchange of India', code: 'NSE' }],
    filings: { accounts: ['AOC-4', 'Financial statements'], confirmation: ['MGT-7', 'Annual return'], appoint: ['DIR-12', 'Appointment of director'], resign: ['DIR-12', 'Cessation of director'], capital: ['PAS-3', 'Return of allotment'], incorporation: ['SPICe+', 'Incorporation'], charge: ['CHG-1', 'Creation of charge'], resolution: ['MGT-14', 'Filing of resolutions'] },
  },
  {
    code: 'SG', currency: 'SGD', symbol: 'S$', count: 150, tld: 'sg', activeLabel: 'Live',
    registry: { name: 'ACRA BizFile+', short: 'ACRA', idLabel: 'UEN', id: (r) => `20${digits(r, 7)}${'ABCDEKMNRWZ'[r.int(0, 10)]}` },
    legalForms: [{ form: 'Pte. Ltd.', type: 'Private company limited by shares', weight: 92 }, { form: 'Ltd.', type: 'Public company limited by shares', weight: 8, listedOnly: true }],
    regions: [reg('Central Region', 1.29, 103.85, 70, 'Singapore'), reg('East Region', 1.35, 103.94, 15, 'Singapore'), reg('West Region', 1.34, 103.7, 15, 'Singapore')],
    exchanges: [{ name: 'Singapore Exchange', code: 'SGX' }],
    filings: { accounts: ['AR-FS', 'Annual return with financial statements'], confirmation: ['AR', 'Annual return'], appoint: ['OFF-APPT', 'Appointment of officer'], resign: ['OFF-CESS', 'Cessation of officer'], capital: ['ROA', 'Return of allotment of shares'], incorporation: ['INC', 'Incorporation'], charge: ['CHG', 'Registration of charge'], resolution: ['RES', 'Resolution'] },
  },
  {
    code: 'JP', currency: 'JPY', symbol: '¥', count: 160, tld: 'jp', activeLabel: 'Active',
    registry: { name: 'Legal Affairs Bureau (Commercial Registry)', short: 'LAB', idLabel: 'Corporate number', id: (r) => digits(r, 13) },
    legalForms: [{ form: 'K.K.', type: 'Kabushiki kaisha', weight: 80 }, { form: 'G.K.', type: 'Godo kaisha', weight: 20 }],
    regions: [reg('Tokyo', 35.68, 139.69, 65), reg('Osaka', 34.69, 135.5, 20), reg('Fukuoka', 33.59, 130.4, 15)],
    exchanges: [{ name: 'Tokyo Stock Exchange', code: 'TSE' }],
    filings: { accounts: ['YUHO', 'Annual securities report'], confirmation: ['REG', 'Registration update'], appoint: ['REG-OFF', 'Change of officers'], resign: ['REG-OFF', 'Change of officers'], capital: ['REG-CAP', 'Change of capital'], incorporation: ['REG-INC', 'Establishment registration'], charge: ['MTG', 'Mortgage registration'], resolution: ['AGM', 'Shareholder meeting resolution'] },
  },
  {
    code: 'AU', currency: 'AUD', symbol: 'A$', count: 170, tld: 'com.au', activeLabel: 'Registered',
    registry: { name: 'ASIC Companies Register', short: 'ASIC', idLabel: 'ACN', id: (r) => `${digits(r, 3)} ${digits(r, 3)} ${digits(r, 3)}` },
    legalForms: [{ form: 'Pty Ltd', type: 'Proprietary company limited by shares', weight: 90 }, { form: 'Ltd', type: 'Public company limited by shares', weight: 10, listedOnly: true }],
    regions: [reg('New South Wales', -33.87, 151.21, 40, 'Sydney'), reg('Victoria', -37.81, 144.96, 35, 'Melbourne'), reg('Queensland', -27.47, 153.03, 15, 'Brisbane'), reg('Western Australia', -31.95, 115.86, 10, 'Perth')],
    exchanges: [{ name: 'Australian Securities Exchange', code: 'ASX' }],
    filings: { accounts: ['388', 'Financial report'], confirmation: ['AR', 'Annual review'], appoint: ['484', 'Change to company details: officeholder appointed'], resign: ['484', 'Change to company details: officeholder ceased'], capital: ['484', 'Change to share structure'], incorporation: ['201', 'Application for registration'], charge: ['PPSR', 'Security interest registration'], resolution: ['205', 'Notification of resolution'] },
  },
  {
    code: 'CA', currency: 'CAD', symbol: 'C$', count: 160, tld: 'ca', activeLabel: 'Active',
    registry: { name: 'Corporations Canada', short: 'CC', idLabel: 'Corporation number', id: (r) => `${digits(r, 7)}-${r.int(0, 9)}` },
    legalForms: [{ form: 'Inc.', type: 'Federal corporation', weight: 85 }, { form: 'Corp.', type: 'Public corporation', weight: 15, listedOnly: true }],
    regions: [reg('Ontario', 43.65, -79.38, 45, 'Toronto'), reg('Quebec', 45.5, -73.57, 25, 'Montréal'), reg('British Columbia', 49.28, -123.12, 22, 'Vancouver'), reg('Alberta', 51.05, -114.07, 8, 'Calgary')],
    exchanges: [{ name: 'Toronto Stock Exchange', code: 'TSX' }],
    filings: { accounts: ['FS', 'Annual financial statements'], confirmation: ['Form 22', 'Annual return'], appoint: ['Form 6', 'Changes regarding directors'], resign: ['Form 6', 'Changes regarding directors'], capital: ['Form 4', 'Articles of amendment'], incorporation: ['Form 1', 'Articles of incorporation'], charge: ['PPSA', 'Financing statement'], resolution: ['RES', 'Special resolution'] },
  },
  {
    code: 'AE', currency: 'AED', symbol: 'AED ', count: 80, tld: 'ae', activeLabel: 'Active',
    registry: { name: 'DIFC Registrar of Companies', short: 'DIFC', idLabel: 'Registration number', id: (r) => String(r.int(1000, 9999)) },
    legalForms: [{ form: 'LLC', type: 'Limited liability company', weight: 80 }, { form: 'Ltd', type: 'Private company (DIFC)', weight: 20 }],
    regions: [reg('Dubai', 25.2, 55.27, 70), reg('Abu Dhabi', 24.45, 54.38, 30)],
    exchanges: [{ name: 'Nasdaq Dubai', code: 'DIFX' }],
    filings: EU_FILINGS('Annual accounts', 'Annual return', 'Change of director', 'Change of share capital', 'Registration'),
  },
  {
    code: 'IL', currency: 'ILS', symbol: '₪', count: 110, tld: 'co.il', activeLabel: 'Active',
    registry: { name: 'Israeli Corporations Authority', short: 'ICA', idLabel: 'Company number', id: (r) => `51${digits(r, 7)}` },
    legalForms: [{ form: 'Ltd.', type: 'Private company', weight: 92 }, { form: 'Ltd. (public)', type: 'Public company', weight: 8, listedOnly: true }],
    regions: [reg('Tel Aviv District', 32.09, 34.78, 65, 'Tel Aviv'), reg('Jerusalem District', 31.77, 35.21, 20, 'Jerusalem'), reg('Haifa District', 32.79, 34.99, 15, 'Haifa')],
    exchanges: [{ name: 'Tel Aviv Stock Exchange', code: 'TASE' }],
    filings: EU_FILINGS('Annual report', 'Annual fee and report', 'Change of directors', 'Allotment of shares', 'Registration'),
  },
  {
    code: 'BR', currency: 'BRL', symbol: 'R$', count: 120, tld: 'com.br', activeLabel: 'Ativa',
    registry: { name: 'Junta Comercial / Receita Federal', short: 'JUCESP', idLabel: 'CNPJ', id: (r) => `${digits(r, 2)}.${digits(r, 3)}.${digits(r, 3)}/0001-${digits(r, 2)}` },
    legalForms: [{ form: 'Ltda.', type: 'Sociedade limitada', weight: 85 }, { form: 'S.A.', type: 'Sociedade anônima', weight: 15, listedOnly: true }],
    regions: [reg('São Paulo', -23.55, -46.63, 60), reg('Rio de Janeiro', -22.91, -43.17, 25), reg('Minas Gerais', -19.92, -43.94, 15, 'Belo Horizonte')],
    exchanges: [{ name: 'B3', code: 'B3' }],
    filings: EU_FILINGS('Demonstrações financeiras', 'Alteração contratual', 'Eleição de administradores', 'Aumento de capital', 'Constituição'),
  },
  {
    code: 'ZA', currency: 'ZAR', symbol: 'R', count: 90, tld: 'co.za', activeLabel: 'In business',
    registry: { name: 'CIPC', short: 'CIPC', idLabel: 'Registration number', id: (r) => `${r.int(2005, 2023)}/${digits(r, 6)}/07` },
    legalForms: [{ form: '(Pty) Ltd', type: 'Private company', weight: 90 }, { form: 'Ltd', type: 'Public company', weight: 10, listedOnly: true }],
    regions: [reg('Gauteng', -26.2, 28.05, 55, 'Johannesburg'), reg('Western Cape', -33.92, 18.42, 35, 'Cape Town'), reg('KwaZulu-Natal', -29.86, 31.02, 10, 'Durban')],
    exchanges: [{ name: 'Johannesburg Stock Exchange', code: 'JSE' }],
    filings: EU_FILINGS('Annual financial statements', 'Annual return', 'CoR39 change of directors', 'CoR38 share capital', 'CoR14.3 registration'),
  },
  {
    code: 'HK', currency: 'HKD', symbol: 'HK$', count: 100, tld: 'com.hk', activeLabel: 'Live',
    registry: { name: 'Hong Kong Companies Registry', short: 'CR', idLabel: 'CR number', id: (r) => digits(r, 7) },
    legalForms: [{ form: 'Limited', type: 'Private company limited by shares', weight: 90 }, { form: 'Holdings Limited', type: 'Public company', weight: 10, listedOnly: true }],
    regions: [reg('Hong Kong Island', 22.28, 114.16, 60, 'Central'), reg('Kowloon', 22.32, 114.17, 30), reg('New Territories', 22.38, 114.19, 10, 'Sha Tin')],
    exchanges: [{ name: 'Hong Kong Exchanges', code: 'HKEX' }],
    filings: { accounts: ['AR', 'Annual return with accounts'], confirmation: ['NAR1', 'Annual return'], appoint: ['ND2A', 'Appointment of director'], resign: ['ND2A', 'Cessation of director'], capital: ['NSC1', 'Return of allotment'], incorporation: ['NNC1', 'Incorporation form'], charge: ['NM1', 'Statement of particulars of charge'], resolution: ['NSC13', 'Resolution'] },
  },
  {
    code: 'NZ', currency: 'NZD', symbol: 'NZ$', count: 70, tld: 'co.nz', activeLabel: 'Registered',
    registry: { name: 'New Zealand Companies Office', short: 'NZCO', idLabel: 'NZBN', id: (r) => `94290${digits(r, 8)}` },
    legalForms: [{ form: 'Limited', type: 'Limited company', weight: 100 }],
    regions: [reg('Auckland', -36.85, 174.76, 60), reg('Wellington', -41.29, 174.78, 25), reg('Canterbury', -43.53, 172.64, 15, 'Christchurch')],
    exchanges: [{ name: 'NZX', code: 'NZX' }],
    filings: EU_FILINGS('Financial statements', 'Annual return', 'Director change', 'Share issue', 'Incorporation'),
  },
];

export const PROFILE_BY_CODE: Record<string, CountryProfile> = Object.fromEntries(COUNTRY_PROFILES.map((p) => [p.code, p]));
export const SEEDED_COUNTRY_CODES = COUNTRY_PROFILES.map((p) => p.code);
export const profileOf = (code: string) => PROFILE_BY_CODE[code] ?? PROFILE_BY_CODE.GB;
