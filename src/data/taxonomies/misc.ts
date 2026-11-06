export const REGIONS = [
  'London', 'South East', 'East of England', 'North East', 'North West', 'Yorkshire and the Humber',
  'East Midlands', 'West Midlands', 'South West', 'Wales', 'Scotland', 'Tayside', 'Northern Ireland',
] as const;
export type Region = (typeof REGIONS)[number];

/** Approximate centroids for the map tab. */
export const REGION_COORDS: Record<Region, [number, number]> = {
  London: [51.507, -0.128],
  'South East': [51.27, -0.75],
  'East of England': [52.2, 0.5],
  'North East': [54.97, -1.6],
  'North West': [53.48, -2.5],
  'Yorkshire and the Humber': [53.8, -1.3],
  'East Midlands': [52.95, -1.15],
  'West Midlands': [52.48, -1.9],
  'South West': [50.9, -3.4],
  Wales: [51.9, -3.6],
  Scotland: [55.95, -3.6],
  Tayside: [56.46, -2.97],
  'Northern Ireland': [54.6, -6.2],
};

export const CH_STATUSES = [
  'Active', 'Administration Order', 'Administrative Receiver Appointed', 'Adverse info', 'Advised to inspect fiche',
  'Converted / Closed', 'Dissolved', 'Dormant Company', 'In Administration', 'In Liquidation',
  'Receiver Manager Appointed', 'Receivership', 'Voluntary Arrangement', 'Live but Receiver Manager on at least one charge',
] as const;

export const STAGES = ['Seed', 'Venture', 'Growth', 'Established', 'Zombie', 'Exited', 'Dead'] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_COLORS: Record<Stage, string> = {
  Seed: '#50A198', Venture: '#3F7DB6', Growth: '#B61483', Established: '#333333', Zombie: '#E0662E', Exited: '#34C345', Dead: '#CCCCCC',
};

export const TRACKING = ['Tracked', 'Ceased tracking', 'Not tracked'] as const;
export type Tracking = (typeof TRACKING)[number];

export const COMPANY_TYPES = ['Private limited company', 'Public limited company', 'Limited liability partnership', 'Community interest company'] as const;
export const LEGAL_FORMS = ['Ltd', 'PLC', 'LLP', 'CIC'] as const;
export const TARGET_MARKETS = ['B2B', 'B2C', 'B2G'] as const;
export const SOCIALS = ['LinkedIn', 'X / Twitter', 'Facebook', 'Instagram', 'YouTube'] as const;

export const SIGNIFICANT_EVENTS = [
  'Accelerator attendance', 'Grant received', 'Patent filed', 'Acquisition', 'IPO', 'Spinout', 'Award won',
  'Office opened', 'Rebrand', 'New CEO appointed', 'Crowdfunding campaign', 'Joint venture', 'Product launch',
  'International expansion', 'Management buyout',
] as const;

export const SIC_CODES: { code: string; label: string }[] = [
  ['62011', 'Ready-made interactive leisure and entertainment software development'],
  ['62012', 'Business and domestic software development'],
  ['62020', 'Information technology consultancy activities'],
  ['62090', 'Other information technology service activities'],
  ['63110', 'Data processing, hosting and related activities'],
  ['63120', 'Web portals'],
  ['58290', 'Other software publishing'],
  ['72190', 'Other research and experimental development on natural sciences and engineering'],
  ['70229', 'Management consultancy activities other than financial management'],
  ['73110', 'Advertising agencies'],
  ['64999', 'Financial intermediation not elsewhere classified'],
  ['64191', 'Banks'],
  ['66190', 'Activities auxiliary to financial intermediation n.e.c.'],
  ['86900', 'Other human health activities'],
  ['85590', 'Other education n.e.c.'],
  ['47910', 'Retail sale via mail order houses or via Internet'],
  ['82990', 'Other business support service activities n.e.c.'],
  ['74909', 'Other professional, scientific and technical activities n.e.c.'],
  ['35110', 'Production of electricity'],
  ['41100', 'Development of building projects'],
  ['26110', 'Manufacture of electronic components'],
].map(([code, label]) => ({ code, label }));

export const INVESTORS = [
  'Harbourline Ventures', 'Kestrel Capital', 'Brightwater Partners', 'Oakhurst Growth', 'Fenwick Seed Fund',
  'Larchmont Angels', 'Northgate Equity', 'Silverbirch VC', 'Tideway Investors', 'Cobalt Square Capital',
  'Marlow Street Ventures', 'Redcliffe Partners', 'Ashgrove Capital', 'Pennant Growth Equity', 'Wyvern Angels',
  'Thistle Ventures', 'Halcyon Seed', 'Granary Capital', 'Juniper Lane Ventures', 'Beacon Hill Fund',
];

export const DEAL_STAGES = ['Seed', 'Venture', 'Growth'] as const;
