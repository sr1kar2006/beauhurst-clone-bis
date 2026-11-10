/// <reference lib="webworker" />
/**
 * Bulk export worker: splits the first sheet into files of `rowsPerFile` rows, builds each file (xlsx or csv)
 * and zips them, posting progress as it goes. Runs off the main thread so the page stays responsive.
 */
import JSZip from 'jszip';
import type { ExportFormat, ExportSpec } from './types';
import { buildXlsx } from './xlsx';
import { buildCsv } from './service';
import { PROTOTYPE_NOTICE } from '../config/app';

interface Msg { spec: ExportSpec; format: ExportFormat; rowsPerFile: number; name: string; csvNotice: boolean }

self.onmessage = async (e: MessageEvent<Msg>) => {
  const { spec, format, rowsPerFile, name, csvNotice } = e.data;
  try {
    const sheet = spec.sheets[0];
    const parts = Math.max(1, Math.ceil(sheet.rows.length / rowsPerFile));
    const zip = new JSZip();
    for (let i = 0; i < parts; i++) {
      const part: ExportSpec = { ...spec, subtitle: `${spec.subtitle ?? ''} Part ${i + 1} of ${parts}`.trim(), sheets: [{ ...sheet, rows: sheet.rows.slice(i * rowsPerFile, (i + 1) * rowsPerFile), footer: undefined }] };
      const file = `${name}-part-${String(i + 1).padStart(2, '0')}-of-${String(parts).padStart(2, '0')}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
      if (format === 'xlsx') zip.file(file, await (await buildXlsx(part)).arrayBuffer());
      else zip.file(file, (csvNotice ? `# ${PROTOTYPE_NOTICE}\n` : '') + buildCsv(part));
      self.postMessage({ type: 'progress', progress: Math.round(((i + 1) / (parts + 1)) * 100), files: i + 1 });
    }
    zip.file('READ-ME.txt', `${PROTOTYPE_NOTICE}\n\n${spec.title}\nRows: ${sheet.rows.length}\nFiles: ${parts}\nExported: ${new Date().toISOString()}\n${(spec.filtersUsed ?? []).join('\n')}\n`);
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }, (m) => self.postMessage({ type: 'progress', progress: Math.round((parts / (parts + 1)) * 100 + m.percent / (parts + 1)), files: parts }));
    self.postMessage({ type: 'done', blob, files: parts });
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) });
  }
};
