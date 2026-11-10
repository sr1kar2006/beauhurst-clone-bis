import type { Company } from '../types';
import type { CompanyProfile, CorpNode, Filing, Seg } from './types';
import { profileOf, type FilingVocab } from '../countries/profiles';
import { countryName } from '../countries/iso3166';

/** UK filing codes produced by the base generator → the jurisdiction's equivalent. */
const CODE_MAP: Record<string, keyof FilingVocab> = {
  NEWINC: 'incorporation', AP01: 'appoint', TM01: 'resign', CH01: 'appoint', CS01: 'confirmation', AA: 'accounts', AA01: 'accounts',
  SH01: 'capital', RESOLUTIONS: 'resolution', MA: 'resolution', MR01: 'charge', AD01: 'confirmation',
};
const CATEGORY: Record<keyof FilingVocab, string> = {
  incorporation: 'Incorporation', appoint: 'Officers', resign: 'Officers', confirmation: 'Annual return', accounts: 'Accounts',
  capital: 'Capital', resolution: 'Resolution', charge: 'Charges',
};
const PHONE: Record<string, string> = {
  IE: '+353 1', US: '+1 415', DE: '+49 30', FR: '+33 1', NL: '+31 20', ES: '+34 91', IT: '+39 02', SE: '+46 8', DK: '+45 33', NO: '+47 22',
  FI: '+358 9', CH: '+41 44', BE: '+32 2', AT: '+43 1', PL: '+48 22', PT: '+351 21', IN: '+91 80', SG: '+65 6', JP: '+81 3', AU: '+61 2',
  CA: '+1 416', AE: '+971 4', IL: '+972 3', BR: '+55 11', ZA: '+27 11', HK: '+852 2', NZ: '+64 9',
};

const postcode = (code: string, seed: number) => {
  const n = (seed % 89999) + 10000;
  switch (code) {
    case 'IE': return `D0${(seed % 8) + 1} ${String.fromCharCode(65 + (seed % 26))}${seed % 10}${String.fromCharCode(70 + (seed % 15))}${(seed >> 3) % 10}`;
    case 'US': case 'DE': case 'FR': case 'ES': case 'IT': case 'FI': return String(n);
    case 'NL': return `${1000 + (seed % 8999)} ${String.fromCharCode(65 + (seed % 26))}${String.fromCharCode(65 + ((seed >> 4) % 26))}`;
    case 'SE': return `${100 + (seed % 899)} ${10 + (seed % 89)}`;
    case 'CA': return `M5V ${seed % 10}${String.fromCharCode(65 + (seed % 26))}${(seed >> 2) % 10}`;
    case 'JP': return `${100 + (seed % 899)}-${1000 + (seed % 8999)}`;
    case 'AE': case 'HK': return '';
    default: return String(1000 + (seed % 8999));
  }
};

/**
 * Adapt a generated profile to the company's jurisdiction: registry, legal form, filing codes and wording,
 * addresses, location hierarchy, phone numbers, corporate tree countries and news sources.
 * Every section keeps its data, so international profiles have the same depth as UK ones.
 */
export function localiseProfile(p: CompanyProfile, c: Company): CompanyProfile {
  const cp = profileOf(c.country);
  const cname = countryName(c.country);
  const seed = [...c.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) >>> 0;
  const base = c.name.replace(new RegExp(`\\s+${c.legalForm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
  const registeredName = `${base} ${c.legalForm}`;
  const codeOf = (code: string) => cp.filings[CODE_MAP[code] ?? 'confirmation'][0];

  const filings: Filing[] = p.filings.map((f) => {
    const kind = CODE_MAP[f.code];
    if (!kind) return f;
    const [code, desc] = cp.filings[kind];
    const lead = kind === 'appoint' || kind === 'resign' ? f.lead : desc;
    return { ...f, code, category: CATEGORY[kind], lead, rest: kind === 'appoint' || kind === 'resign' ? f.rest : f.rest.replace(/31 March/, '31 December') };
  });

  const relabel = (parts: Seg[]): Seg[] => parts.map((s) => {
    if (typeof s === 'string') return s.replace('Incorporated at Companies House as ', `Registered with ${cp.registry.name} as `).replace('Companies House', cp.registry.name);
    if (s.kind === 'filing' && CODE_MAP[s.t]) return { ...s, t: codeOf(s.t) };
    if (s.kind === 'company' && s.id === c.id && /Limited$/.test(s.t)) return { ...s, t: registeredName };
    return s;
  });

  const tree = (n: CorpNode): CorpNode => ({
    ...n,
    country: n.country === 'GB' ? c.country : n.country,
    name: n.name.replace(/ Limited$/, ` ${c.legalForm}`),
    registeredName: n.current ? registeredName : n.registeredName.replace(/ Limited$/, ` ${c.legalForm}`),
    children: n.children.map(tree),
  });

  const street = p.addresses.headOffice[0];
  const pc = postcode(c.country, seed);
  const headOffice = [street, [pc, c.city].filter(Boolean).join(' '), c.headOffice !== c.city ? c.headOffice : '', cname].filter(Boolean);

  return {
    ...p,
    registeredName,
    legalForm: c.companyType,
    smeStatus: p.smeStatus,
    addresses: { headOffice, registered: headOffice, trading: [] },
    locationHierarchy: [{ value: c.city, type: 'City' }, { value: c.headOffice, type: 'Region' }, { value: cname, type: 'Country' }],
    contact: {
      ...p.contact,
      phone: p.contact.phone ? `${PHONE[c.country] ?? '+00'} ${String(seed % 9000 + 1000)} ${String((seed >> 5) % 9000 + 1000)}` : undefined,
    },
    highGrowthLists: p.highGrowthLists.map((h) => ({ ...h, name: h.name.replace('UK', cname) })),
    timeline: p.timeline.map((e) => ({ ...e, parts: relabel(e.parts), sub: e.sub && relabel(e.sub) })),
    activity: p.activity.map((a) => ({ ...a, parts: relabel(a.parts) })),
    filings,
    news: p.news.map((n) => ({ ...n, source: n.source.replace(/\.(co\.)?uk$/, `.${cp.tld}`) })),
    corporateTree: tree(p.corporateTree),
    patents: p.patents.map((pt) => ({ ...pt, applicationNo: pt.applicationNo.replace(/^GB/, c.country), jurisdiction: pt.jurisdiction === 'GB' ? c.country : pt.jurisdiction })),
    charges: p.charges.map((ch) => ({ ...ch, entitled: ch.entitled.replace(/ (PLC|Limited)$/, ` ${cp.legalForms[cp.legalForms.length - 1].form}`) })),
    credit: { ...p.credit, accountType: c.listed ? 'Consolidated (listed)' : p.credit.accountType },
  };
}
