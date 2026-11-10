import type { Entry, Row, Cell, Kind } from '../../compare/model';
import type { ExportFormat, ExportSpec } from '../../export/types';
import { exportSpec } from '../../export/service';
import { sourceFor } from '../../data/sources';
import { comparePath } from '../../store/compareStore';

/** Export the comparison as shown (current currency and filters) to Excel or PDF. */
export function exportComparison(format: ExportFormat, es: Entry[], rows: Row[], fmt: (v: Cell, k: Kind, col: number | 'median') => string, median: boolean) {
  const cols = [
    { key: 'section', label: 'Section', width: 14 },
    { key: 'metric', label: 'Metric', width: 34 },
    ...es.map((e, i) => ({ key: `c${i}`, label: e.c.name, width: 26 })),
    ...(median ? [{ key: 'median', label: 'Industry median', width: 18 }] : []),
  ];
  const spec: ExportSpec = {
    title: `Company comparison: ${es.map((e) => e.c.name).join(', ')}`,
    subtitle: `${es.length} companies across ${new Set(es.map((e) => e.c.country)).size} countries`,
    sheets: [{ name: 'Comparison', columns: cols, rows: rows.map((r) => ({ section: r.section, metric: r.label, ...Object.fromEntries(r.values.map((v, i) => [`c${i}`, fmt(v, r.kind, i)])), ...(median ? { median: r.median == null ? '—' : fmt(r.median, r.kind, 'median') } : {}) })) }],
    sources: [...new Set(es.flatMap((e) => [sourceFor('company-details', e.c.country).id, sourceFor('accounts', e.c.country).id, 'credit-partner', 'in-house']))],
    viewPath: comparePath(es.map((e) => e.c.id)),
    orientation: 'landscape',
  };
  return exportSpec(spec, format, 'company-comparison');
}
