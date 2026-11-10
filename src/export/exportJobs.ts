import { TENDER } from '../config/tender';
import type { ExportFormat, ExportSpec } from './types';
import { setBulkHandler } from './requestExport';
import { useAllowance, useJobs, overage, type ExportJob } from './stores';
import { useUi } from '../store/uiStore';
import { bus } from '../lib/eventBus';
import { csvNoticeEnabled, downloadBlob } from '../lib/download';
import { slugify } from './service';

export const rowCount = (spec: ExportSpec) => spec.sheets.reduce((n, s) => n + s.rows.length, 0);

/** Exports above the bulk threshold open the allowance/confirm modal instead of downloading directly. */
export function installBulkHandler() {
  setBulkHandler((spec, format, filename) => {
    if (rowCount(spec) <= TENDER.bulkThreshold.value) return false;
    useJobs.getState().setPending({ spec, format, filename });
    useUi.getState().open('bulk-export', 'modal');
    return true;
  });
}

/** Start a bulk export job in a web worker. Returns the job id. */
export function startJob(spec: ExportSpec, format: ExportFormat, filename?: string): string {
  const rows = rowCount(spec);
  const { used, allowance, consume } = useAllowance.getState();
  const { over } = overage(used, rows, allowance);
  const now = new Date();
  const name = filename ?? slugify(spec.title);
  const job: ExportJob = {
    id: `job-${now.getTime().toString(36)}`, name: spec.title, rows, format, files: 0, size: 0, status: 'Running', progress: 0,
    created: now.toISOString(), expires: new Date(now.getTime() + TENDER.exportExpiryDays.value * 864e5).toISOString(), overageRows: over || undefined,
  };
  const jobs = useJobs.getState();
  jobs.add(job, spec, format, filename);
  consume(rows);
  if (over) bus.emit('audit', { action: 'Export over allowance', detail: `${spec.title}: ${rows.toLocaleString('en-GB')} rows, ${over.toLocaleString('en-GB')} over the allowance` });
  bus.emit('export:done', { title: spec.title, format, rows, bulk: true });

  const worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (e: MessageEvent<{ type: string; progress?: number; files?: number; blob?: Blob; message?: string }>) => {
    const m = e.data;
    if (m.type === 'progress') jobs.update(job.id, { progress: m.progress, files: m.files });
    else if (m.type === 'done') {
      jobs.setBlob(job.id, m.blob!);
      jobs.update(job.id, { status: 'Ready', progress: 100, files: m.files, size: m.blob!.size });
      worker.terminate();
    } else if (m.type === 'error') { jobs.update(job.id, { status: 'Failed' }); worker.terminate(); }
  };
  worker.postMessage({ spec, format: format === 'pdf' ? 'xlsx' : format, rowsPerFile: TENDER.rowsPerFile.value, name, csvNotice: csvNoticeEnabled() });
  return job.id;
}

export function downloadJob(id: string, blob: Blob | undefined, name: string) {
  if (blob) downloadBlob(blob, `${slugify(name)}.zip`, 'application/zip');
}
