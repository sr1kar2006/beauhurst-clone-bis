import { create } from 'zustand';
import { load, save } from '../lib/storage';

export type IssueStatus = 'Received' | 'In review' | 'Corrected' | 'Rejected';
export interface ReportedIssue {
  id: string;
  companyId?: string;
  companyName: string;
  section: string;
  description: string;
  reported: string; // ISO date
  status: IssueStatus;
  resolution?: string;
}

const SEED: ReportedIssue[] = [
  { id: 'iss-4', companyId: 'lumen-bank', companyName: 'Lumen Bank', section: 'Details', description: 'Head office address has moved to Lantern Yard.', reported: '2024-11-12', status: 'Received' },
  { id: 'iss-3', companyId: 'de-1', companyName: 'Tusklab AG', section: 'People', description: 'Managing director listed twice under different spellings.', reported: '2024-11-04', status: 'In review' },
  { id: 'iss-2', companyId: 'lumen-bank', companyName: 'Lumen Bank', section: 'Transactions', description: 'Series C amount should be £70m, not £75m.', reported: '2024-10-21', status: 'Corrected', resolution: 'Amount verified against the SH01 allotment and corrected on 25/10/2024.' },
  { id: 'iss-1', companyId: 'harrowmere-group', companyName: 'Harrowmere Group', section: 'Corporate Structure', description: 'Harrowmere Logistics B.V. is no longer a subsidiary.', reported: '2024-09-30', status: 'Rejected', resolution: 'The latest filed group accounts (March 2024) still consolidate this entity.' },
];

const KEY = 'nb.reportedIssues';

interface Draft { companyId?: string; companyName?: string; section?: string }
interface State {
  issues: ReportedIssue[];
  draft: Draft;
  setDraft: (d: Draft) => void;
  report: (i: Omit<ReportedIssue, 'id' | 'reported' | 'status'>) => ReportedIssue;
}

export const useIssues = create<State>((set, get) => ({
  issues: load<ReportedIssue[]>(KEY, SEED),
  draft: {},
  setDraft: (draft) => set({ draft }),
  report: (i) => {
    const issue: ReportedIssue = { ...i, id: `iss-${Date.now().toString(36)}`, reported: new Date().toISOString().slice(0, 10), status: 'Received' };
    const issues = [issue, ...get().issues];
    save(KEY, issues);
    set({ issues });
    return issue;
  },
}));
