import type { ExportColumn, ExportSpec } from './types';
import { PROTOTYPE_NOTICE, publicUrl } from '../config';
import { SOURCE_BY_ID } from '../data/sources';
import { countryName } from '../data/countries/iso3166';
import { currencySymbol } from '../lib/money';

/** Column index → Excel letters (0 → A, 26 → AA). */
export function colLetter(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

/** Replace {key} placeholders with A1 references on row `r` (1-based). Unknown keys throw. */
export function formulaToA1(template: string, columns: ExportColumn[], r: number, lastRow = r): string {
  const idx = (key: string) => {
    const i = columns.findIndex((c) => c.key === key);
    if (i < 0) throw new Error(`Unknown column in formula: ${key}`);
    return colLetter(i);
  };
  return template.replace(/^=/, '')
    .replace(/\{range:([^}]+)\}/g, (_, key: string) => `${idx(key)}$3:${idx(key)}$${lastRow}`)
    .replace(/\{([^}]+)\}/g, (_, key: string) => `${idx(key)}${r}`);
}

function numFmt(c: ExportColumn): string | undefined {
  switch (c.format) {
    case 'gbp': return '"£"#,##0;[Red]-"£"#,##0';
    case 'money': { const s = currencySymbol(c.currency ?? 'GBP').trim(); return `"${s}"#,##0;[Red]-"${s}"#,##0`; }
    case 'int': return '#,##0';
    case 'pct': return '0.0"%"';
    case 'ratio': return '0.00';
    case 'date': return 'dd/mm/yyyy';
    default: return undefined;
  }
}

const sheetName = (s: string) => s.replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);

export async function buildXlsx(spec: ExportSpec): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = spec.author ?? 'Northbeam prototype';
  wb.created = new Date();
  const header = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4B4291' } } };

  // Read me first
  const readme = wb.addWorksheet('Read me');
  readme.columns = [{ width: 26 }, { width: 100 }];
  const rm: [string, string][] = [
    ['Notice', PROTOTYPE_NOTICE],
    ['Title', spec.title],
    ...(spec.subtitle ? [['Subtitle', spec.subtitle] as [string, string]] : []),
    ['Exported', new Date().toLocaleString('en-GB')],
    ['Filters used', spec.filtersUsed?.length ? spec.filtersUsed.join('; ') : 'None'],
    ['View online', spec.viewPath ? publicUrl(spec.viewPath) : '—'],
    ['Sheets', [...spec.sheets.map((s) => s.name), 'Sources'].join(', ')],
    ['Calculated columns', 'Columns marked (calc) are live Excel formulas; edit the inputs and they recalculate.'],
  ];
  rm.forEach(([k, v]) => { const row = readme.addRow([k, v]); row.getCell(1).font = { bold: true }; });
  readme.getRow(1).getCell(2).font = { bold: true, color: { argb: 'FF9B1C1C' } };

  for (const s of spec.sheets) {
    const ws = wb.addWorksheet(sheetName(s.name), { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }] });
    // row 1: prototype note; row 2: headers
    ws.addRow([`${PROTOTYPE_NOTICE} ${spec.title}.`]).font = { italic: true, color: { argb: 'FF7A5B00' } };
    const hr = ws.addRow(s.columns.map((c) => (c.formula ? `${c.label} (calc)` : c.label)));
    hr.eachCell((cell) => { cell.font = header.font; cell.fill = header.fill; cell.alignment = { vertical: 'middle' }; });
    s.columns.forEach((c, i) => { ws.getColumn(i + 1).width = c.width ?? Math.min(48, Math.max(12, c.label.length + 4)); const f = numFmt(c); if (f) ws.getColumn(i + 1).numFmt = f; });
    s.rows.forEach((row, ri) => {
      const r = ri + 3;
      const values = s.columns.map((c) => {
        const v = row[c.key];
        if (c.formula) return { formula: formulaToA1(c.formula, s.columns, r, s.rows.length + 2), result: typeof v === 'number' && isFinite(v) ? v : undefined };
        if (c.format === 'date' && typeof v === 'string' && v) return new Date(v);
        return v ?? null;
      });
      ws.addRow(values);
    });
    for (const f of s.footer ?? []) {
      const fr = ws.addRow(s.columns.map((c) => f[c.key] ?? null));
      fr.font = { bold: true };
      fr.eachCell((cell) => { cell.border = { top: { style: 'thin' } }; });
    }
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2 + s.rows.length, column: s.columns.length } };
  }

  // Calculations sheet: explains every calculated column
  const calcs = spec.sheets.flatMap((s) => s.columns.filter((c) => c.formula || c.definition).map((c) => [s.name, c.label, c.definition ?? `=${c.formula!.replace(/\{(?:range:)?([^}]+)\}/g, (_, k) => s.columns.find((x) => x.key === k)?.label ?? k)}`]));
  if (calcs.length) {
    const cs = wb.addWorksheet('Calculations');
    cs.columns = [{ header: 'Sheet', width: 20 }, { header: 'Column', width: 30 }, { header: 'Definition', width: 70 }];
    cs.getRow(1).eachCell((cell) => { cell.font = header.font; cell.fill = header.fill; });
    calcs.forEach((c) => cs.addRow(c));
  }

  // Sources
  const src = wb.addWorksheet('Sources');
  src.columns = [{ header: 'Source', width: 40 }, { header: 'Type', width: 22 }, { header: 'Jurisdictions', width: 30 }, { header: 'Licence', width: 50 }, { header: 'Website', width: 45 }];
  src.getRow(1).eachCell((cell) => { cell.font = header.font; cell.fill = header.fill; });
  (spec.sources?.length ? spec.sources : ['companies-house']).map((id) => SOURCE_BY_ID[id]).filter(Boolean).forEach((s) => {
    src.addRow([s.name, s.type, s.jurisdictions[0] === '*' ? 'Global' : s.jurisdictions.map(countryName).join(', '), s.licence, s.url ?? '']);
  });
  src.addRow([]);
  src.addRow([PROTOTYPE_NOTICE]).font = { italic: true };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
