import type { ExportFormat, ExportSpec } from './types';
import { exportSpec } from './service';

/**
 * Entry point for user-initiated exports. Small exports download straight away; large ones go through the
 * bulk-export flow (allowance check, background job, zip) wired in by exportJobs.ts.
 */
type BulkHandler = (spec: ExportSpec, format: ExportFormat, filename?: string) => boolean;
let bulkHandler: BulkHandler | null = null;
export function setBulkHandler(h: BulkHandler) { bulkHandler = h; }

export function requestExport(spec: ExportSpec, format: ExportFormat, filename?: string): Promise<void> | void {
  if (bulkHandler?.(spec, format, filename)) return; // handled as a bulk job
  return exportSpec(spec, format, filename);
}
