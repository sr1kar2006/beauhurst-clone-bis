import { create } from 'zustand';
import { load, save } from '../lib/storage';
import { TENDER } from '../config/tender';
import type { ExportFormat, ExportSpec } from './types';

// ---------------------------------------------------------------- bulk-export allowance (CMA clarification 2.3)
const ALLOW_KEY = 'nb.allowance';
interface Allowance { period: string; used: number }
const period = (d = new Date()) => d.toISOString().slice(0, 7);

/** Next reset date: the configured day of next month. */
export function nextReset(d = new Date()): Date {
  const day = TENDER.allowanceResetDay.value;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + (d.getUTCDate() >= day ? 1 : 0), day));
}

interface AllowanceState extends Allowance {
  allowance: number;
  consume: (rows: number) => void;
  /** demo helper: put usage close to the limit to show the overage confirm */
  setUsed: (n: number) => void;
}
const seed = (): Allowance => { const a = load<Allowance>(ALLOW_KEY, { period: period(), used: 61_000 }); return a.period === period() ? a : { period: period(), used: 0 }; };

export const useAllowance = create<AllowanceState>((set, get) => ({
  ...seed(),
  allowance: TENDER.bulkAllowanceRows.value,
  consume: (rows) => { const next = { period: period(), used: get().used + rows }; save(ALLOW_KEY, next); set(next); },
  setUsed: (used) => { const next = { period: period(), used }; save(ALLOW_KEY, next); set(next); },
}));

/** Rows over the allowance and the charge for them (per started 1,000 rows). */
export function overage(used: number, rows: number, allowance = TENDER.bulkAllowanceRows.value) {
  const over = Math.max(0, used + rows - Math.max(allowance, used));
  return { over, charge: Math.ceil(over / 1000) * TENDER.overagePer1000.value };
}

// ---------------------------------------------------------------- export jobs (Downloads page)
export type JobStatus = 'Queued' | 'Running' | 'Ready' | 'Expired' | 'Failed';
export interface ExportJob {
  id: string;
  name: string;
  rows: number;
  format: ExportFormat;
  files: number;
  size: number;
  status: JobStatus;
  progress: number;
  created: string;
  expires: string;
  overageRows?: number;
}
const JOBS_KEY = 'nb.exportJobs';
const blobs = new Map<string, Blob>(); // session only
const specs = new Map<string, { spec: ExportSpec; format: ExportFormat; filename?: string }>();

const SEED_JOBS: ExportJob[] = [
  { id: 'job-seed-2', name: 'All UK fintech companies', rows: 18_420, format: 'xlsx', files: 4, size: 3_420_000, status: 'Expired', progress: 100, created: '2024-10-28T10:12:00Z', expires: '2024-11-04T10:12:00Z' },
  { id: 'job-seed-1', name: 'Ireland: active companies', rows: 9_870, format: 'csv', files: 2, size: 1_240_000, status: 'Expired', progress: 100, created: '2024-10-14T15:40:00Z', expires: '2024-10-21T15:40:00Z' },
];

interface JobsState {
  jobs: ExportJob[];
  pending: { spec: ExportSpec; format: ExportFormat; filename?: string } | null;
  setPending: (p: JobsState['pending']) => void;
  add: (j: ExportJob, spec: ExportSpec, format: ExportFormat, filename?: string) => void;
  update: (id: string, patch: Partial<ExportJob>) => void;
  setBlob: (id: string, b: Blob) => void;
}
const persistJobs = (jobs: ExportJob[]) => save(JOBS_KEY, jobs.map((j) => (j.status === 'Running' || j.status === 'Queued' ? { ...j, status: 'Failed' as JobStatus } : j)));

export const useJobs = create<JobsState>((set, get) => ({
  jobs: load<ExportJob[]>(JOBS_KEY, SEED_JOBS).map((j) => (new Date(j.expires) < new Date() && j.status === 'Ready' ? { ...j, status: 'Expired' as JobStatus } : j)),
  pending: null,
  setPending: (pending) => set({ pending }),
  add: (j, spec, format, filename) => { specs.set(j.id, { spec, format, filename }); const jobs = [j, ...get().jobs]; persistJobs(jobs); set({ jobs }); },
  update: (id, patch) => { const jobs = get().jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)); persistJobs(jobs); set({ jobs }); },
  setBlob: (id, b) => { blobs.set(id, b); },
}));

export const jobBlob = (id: string) => blobs.get(id);
export const jobSpec = (id: string) => specs.get(id);
