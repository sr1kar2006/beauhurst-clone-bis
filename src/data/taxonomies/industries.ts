export type TaxType = 'industry' | 'buzzword';

export interface IndustryGroup {
  id: string;
  label: string;
  children?: IndustryGroup[];
}
export interface IndustryItem {
  id: string;
  label: string;
  type: TaxType;
  /** leaf group ids (and their parents, filled in below) */
  groups: string[];
}

export const INDUSTRY_GROUPS: IndustryGroup[] = [
  { id: 'all', label: 'All' },
  { id: 'creative', label: 'Creative, media and publishing', children: [
    { id: 'creative/media', label: 'Media and broadcasting' },
    { id: 'creative/publishing', label: 'Publishing' },
    { id: 'creative/gaming', label: 'Games and interactive' },
  ] },
  { id: 'education', label: 'Education' },
  { id: 'environment', label: 'Environment, agriculture and waste', children: [
    { id: 'environment/energy', label: 'Clean energy' },
    { id: 'environment/agri', label: 'Agriculture' },
    { id: 'environment/waste', label: 'Waste and recycling' },
  ] },
  { id: 'financial', label: 'Financial services' },
  { id: 'healthcare', label: 'Healthcare and wellbeing', children: [
    { id: 'healthcare/services', label: 'Healthcare services' },
    { id: 'healthcare/wellbeing', label: 'Wellbeing' },
  ] },
  { id: 'it', label: 'Information technology, telecommunications and data', children: [
    { id: 'it/telecoms', label: 'Telecommunications' },
    { id: 'it/data', label: 'Data' },
    { id: 'it/hardware', label: 'Hardware' },
  ] },
  { id: 'lifesciences', label: 'Life sciences and medical technology' },
  { id: 'lifestyle', label: 'Lifestyle and entertainment', children: [
    { id: 'lifestyle/food', label: 'Food and drink' },
    { id: 'lifestyle/travel', label: 'Travel and leisure' },
    { id: 'lifestyle/sport', label: 'Sport and fitness' },
  ] },
  { id: 'professional', label: 'Professional services', children: [
    { id: 'professional/legal', label: 'Legal' },
    { id: 'professional/consulting', label: 'Consulting and advisory' },
  ] },
  { id: 'property', label: 'Property, infrastructure and construction', children: [
    { id: 'property/construction', label: 'Construction' },
    { id: 'property/realestate', label: 'Real estate' },
  ] },
  { id: 'safety', label: 'Safety and security' },
  { id: 'software', label: 'Software' },
  { id: 'supply', label: 'Supply chain, manufacturing and commerce models', children: [
    { id: 'supply/manufacturing', label: 'Manufacturing' },
    { id: 'supply/logistics', label: 'Logistics' },
    { id: 'supply/commerce', label: 'Commerce models' },
  ] },
];

// [label, i=industry | b=buzzword, groups]
const RAW: [string, 'i' | 'b', string[]][] = [
  ['3D printing', 'b', ['supply/manufacturing']],
  ['Accessories for tech devices', 'i', ['it/hardware']],
  ['Accountancy and tax', 'i', ['professional/consulting', 'financial']],
  ['ActiveTech', 'b', ['lifestyle/sport']],
  ['AdTech', 'b', ['creative/media']],
  ['AgeTech', 'b', ['healthcare/wellbeing']],
  ['Aggregates', 'i', ['property/construction']],
  ['Agriculture, land farming and forestry', 'i', ['environment/agri']],
  ['AgriTech', 'b', ['environment/agri']],
  ['Aircraft', 'i', ['supply/manufacturing']],
  ['Airports', 'i', ['lifestyle/travel', 'property']],
  ['Alcoholic beverages', 'i', ['lifestyle/food']],
  ['Alternative finance', 'i', ['financial']],
  ['Alternative medicine', 'i', ['healthcare/wellbeing']],
  ['Animal feed and pet food', 'i', ['environment/agri']],
  ['Appliances and kitchenware', 'i', ['supply/manufacturing']],
  ['Application software', 'i', ['software']],
  ['Architecture', 'i', ['property/construction', 'professional']],
  ['Artificial Intelligence', 'b', ['software']],
  ['Asset management', 'i', ['financial']],
  ['Audio and music', 'i', ['creative/media']],
  ['Augmented reality', 'b', ['software']],
  ['Automotive', 'i', ['supply/manufacturing']],
  ['Banking', 'i', ['financial']],
  ['Batteries and energy storage', 'i', ['environment/energy']],
  ['Big data', 'b', ['software']],
  ['Biotechnology', 'i', ['lifesciences']],
  ['Blockchain', 'b', ['software']],
  ['Book publishing', 'i', ['creative/publishing']],
  ['Broadcasting', 'i', ['creative/media']],
  ['Building materials', 'i', ['property/construction']],
  ['Business support services', 'i', ['professional/consulting']],
  ['Carbon capture', 'b', ['environment/energy']],
  ['Catering and food services', 'i', ['lifestyle/food']],
  ['Chatbots', 'b', ['software']],
  ['Chemicals', 'i', ['supply/manufacturing']],
  ['CleanTech', 'b', ['environment/energy']],
  ['Clinical trials', 'i', ['lifesciences']],
  ['Cloud computing', 'b', ['software']],
  ['CollabTech', 'b', ['software']],
  ['Commercial property', 'i', ['property/realestate']],
  ['Connectivity and networks', 'i', ['it/telecoms']],
  ['Construction services', 'i', ['property/construction']],
  ['Consumer electronics', 'i', ['it/hardware']],
  ['Contract research', 'i', ['lifesciences']],
  ['Cosmetics and personal care', 'i', ['lifestyle', 'healthcare/wellbeing']],
  ['Courier and delivery', 'i', ['supply/logistics']],
  ['Creative agencies', 'i', ['creative']],
  ['CryptoTech', 'b', ['financial']],
  ['Cyber security', 'i', ['safety', 'it']],
  ['Data provision', 'i', ['it/data']],
  ['Data analytics', 'i', ['it/data']],
  ['Data centres', 'i', ['it/data']],
  ['Defence', 'i', ['safety']],
  ['Dental', 'i', ['healthcare/services']],
  ['Design services', 'i', ['creative']],
  ['Diagnostics', 'i', ['lifesciences']],
  ['Digital health', 'b', ['healthcare']],
  ['Direct to consumer', 'b', ['supply/commerce']],
  ['Drones', 'b', ['safety', 'it/hardware']],
  ['Drug discovery', 'i', ['lifesciences']],
  ['E-commerce', 'b', ['supply/commerce']],
  ['EdTech', 'b', ['education']],
  ['Electric vehicles', 'b', ['environment/energy', 'supply/manufacturing']],
  ['Electronics manufacturing', 'i', ['supply/manufacturing', 'it/hardware']],
  ['Embedded systems', 'b', ['software']],
  ['Energy efficiency', 'i', ['environment/energy']],
  ['Engineering services', 'i', ['professional']],
  ['Esports', 'b', ['creative/gaming', 'lifestyle/sport']],
  ['Events and conferences', 'i', ['lifestyle']],
  ['Facilities management', 'i', ['property']],
  ['Fashion and apparel', 'i', ['lifestyle']],
  ['FemTech', 'b', ['healthcare']],
  ['Film and television', 'i', ['creative/media']],
  ['FinTech', 'b', ['financial']],
  ['Fire and safety equipment', 'i', ['safety']],
  ['Fitness and gyms', 'i', ['lifestyle/sport', 'healthcare/wellbeing']],
  ['FoodTech', 'b', ['lifestyle/food']],
  ['Freight and shipping', 'i', ['supply/logistics']],
  ['Funding platforms', 'b', ['software', 'financial']],
  ['Further and higher education', 'i', ['education']],
  ['Games development', 'i', ['creative/gaming']],
  ['Genomics', 'b', ['lifesciences']],
  ['Geospatial technology', 'b', ['software']],
  ['Gig economy', 'b', ['supply/commerce']],
  ['Green building', 'b', ['property', 'environment']],
  ['Hardware', 'i', ['it/hardware']],
  ['HealthTech', 'b', ['healthcare']],
  ['Hospitality', 'i', ['lifestyle/travel']],
  ['Hotels and accommodation', 'i', ['lifestyle/travel']],
  ['HR and recruitment', 'i', ['professional']],
  ['Hydrogen', 'b', ['environment/energy']],
  ['Image and voice recognition', 'b', ['software']],
  ['Industrial machinery', 'i', ['supply/manufacturing']],
  ['Insurance', 'i', ['financial']],
  ['InsurTech', 'b', ['financial']],
  ['Internet of Things', 'b', ['software']],
  ['Investment banking', 'i', ['financial']],
  ['Journalism and news', 'i', ['creative/publishing']],
  ['Laboratory equipment', 'i', ['lifesciences']],
  ['LegalTech', 'b', ['professional/legal']],
  ['Legal services', 'i', ['professional/legal']],
  ['Logistics services', 'i', ['supply/logistics']],
  ['Machine learning', 'b', ['it/data']],
  ['Management consultancy', 'i', ['professional/consulting']],
  ['Marine and maritime', 'i', ['supply/logistics']],
  ['Marketing services', 'i', ['creative', 'professional']],
  ['Medical devices', 'i', ['lifesciences']],
  ['Mental health', 'i', ['healthcare/wellbeing']],
  ['Mining and quarrying', 'i', ['property']],
  ['Mobile apps', 'b', ['software']],
  ['Mobility as a service', 'b', ['supply/logistics']],
  ['Non-alcoholic beverages', 'i', ['lifestyle/food']],
  ['Nuclear energy', 'i', ['environment/energy']],
  ['Nursing and care homes', 'i', ['healthcare/services']],
  ['Online marketplace', 'b', ['software', 'supply/commerce']],
  ['Open source', 'b', ['software']],
  ['Payments', 'i', ['financial']],
  ['Pharmaceuticals', 'i', ['lifesciences']],
  ['Photonics', 'b', ['it/hardware']],
  ['Plant-based food', 'b', ['lifestyle/food']],
  ['Plastics and packaging', 'i', ['supply/manufacturing']],
  ['PropTech', 'b', ['property/realestate']],
  ['Quantum computing', 'b', ['software']],
  ['Real estate agency', 'i', ['property/realestate']],
  ['RegTech', 'b', ['financial', 'professional/legal']],
  ['Renewable energy', 'i', ['environment/energy']],
  ['Residential property', 'i', ['property/realestate']],
  ['Restaurants and bars', 'i', ['lifestyle/food']],
  ['Retail', 'i', ['supply/commerce']],
  ['Robotics', 'b', ['supply/manufacturing', 'it/hardware']],
  ['Satellites and space', 'i', ['it/telecoms']],
  ['Schools', 'i', ['education']],
  ['Security services', 'i', ['safety']],
  ['Semiconductors', 'i', ['it/hardware']],
  ['Smart cities', 'b', ['property']],
  ['Social media', 'b', ['creative/media']],
  ['Software development tools', 'b', ['software']],
  ['Sports clubs and venues', 'i', ['lifestyle/sport']],
  ['Subscription models', 'b', ['supply/commerce']],
  ['Supply chain software', 'i', ['supply/logistics']],
  ['Sustainable fashion', 'b', ['lifestyle', 'environment']],
  ['Telecommunications', 'i', ['it/telecoms']],
  ['Training and coaching', 'i', ['education']],
  ['Travel agencies', 'i', ['lifestyle/travel']],
  ['Veterinary services', 'i', ['healthcare/services']],
  ['Virtual reality', 'b', ['software']],
  ['Waste management', 'i', ['environment/waste']],
  ['Water treatment', 'i', ['environment/waste']],
  ['Wearables', 'b', ['it/hardware', 'healthcare']],
  ['Wholesale', 'i', ['supply/commerce']],
];

export const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const INDUSTRY_ITEMS: IndustryItem[] = RAW.map(([label, t, groups]): IndustryItem => {
  const all = new Set<string>();
  groups.forEach((g) => { all.add(g); if (g.includes('/')) all.add(g.split('/')[0]); });
  return { id: slug(label), label, type: t === 'i' ? 'industry' : 'buzzword', groups: [...all] };
}).sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base', numeric: true }));

export const INDUSTRY_BY_ID = new Map(INDUSTRY_ITEMS.map((i) => [i.id, i]));

export function findGroup(id: string, list = INDUSTRY_GROUPS): IndustryGroup | undefined {
  for (const g of list) {
    if (g.id === id) return g;
    const c = g.children && findGroup(id, g.children);
    if (c) return c;
  }
  return undefined;
}

export function itemsInGroup(groupId: string): IndustryItem[] {
  if (groupId === 'all') return INDUSTRY_ITEMS;
  return INDUSTRY_ITEMS.filter((i) => i.groups.includes(groupId));
}

export const AI_ID = 'artificial-intelligence';
export const SOFTWARE_GROUP = 'software';
