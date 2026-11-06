import { slug } from './industries';

export interface TreeNode { id: string; label: string; children?: TreeNode[] }

const mk = (parent: string, labels: string[]): TreeNode[] => labels.map((l) => ({ id: `${parent}:${slug(l)}`, label: l }));

export const SIGNAL_TREE: TreeNode[] = [
  { id: 'growth', label: 'Growth', children: mk('growth', ['Equity fundraising', 'Debt fundraising', 'MBO/MBI', 'Accelerator', '10% scaleup', '20% scaleup', 'Acquired', 'IPO', 'High growth list']) },
  { id: 'innovation', label: 'Innovation', children: mk('innovation', ['Grant received', 'Patent filed', 'Academic spinout', 'R&D tax credit', 'Innovation accolade']) },
  { id: 'environmental', label: 'Environmental', children: mk('environmental', ['Environmental accolades', 'Clean & renewable energy', 'Sustainable farming & food production', 'Green infrastructure & building', 'Green transport']) },
  { id: 'social', label: 'Social & Governance', children: mk('social', ['Age diversity of directors', 'Social impact accolades', 'Gender equality of directors', 'Gender pay equality']) },
  { id: 'risk', label: 'Risk', children: mk('risk', ['Late filing', 'Negative net assets', 'CCJ registered', 'Director resignations', 'Going concern warning']) },
];

/** Two-column layout for the tree popover. */
export const SIGNAL_COLUMNS: string[][] = [['growth', 'innovation', 'environmental'], ['social', 'risk']];

export const SIGNAL_LEAVES = SIGNAL_TREE.flatMap((p) => p.children!);
export const SIGNAL_LABEL = new Map(SIGNAL_LEAVES.map((s) => [s.id, s.label]));

export const SIG = {
  equity: 'growth:equity-fundraising',
  debt: 'growth:debt-fundraising',
  mbo: 'growth:mbo-mbi',
  accelerator: 'growth:accelerator',
  scale10: 'growth:10-scaleup',
  scale20: 'growth:20-scaleup',
  acquired: 'growth:acquired',
  ipo: 'growth:ipo',
  highGrowth: 'growth:high-growth-list',
} as const;
