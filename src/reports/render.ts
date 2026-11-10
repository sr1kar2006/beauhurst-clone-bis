import type { EChartsOption } from 'echarts';
import type { Company } from '../data/types';
import type { Block, Report } from './model';
import { FIELD_BY_ID, FIELD_IDS, fieldSeries, kindToFormat } from '../analysis/fields';
import { compile } from '../formula/evaluate';
import { aggregateValues, fmtVal } from '../analysis/AnalysisGrid';
import { countryName } from '../data/countries/iso3166';
import { sourceFor } from '../data/sources';
import type { ExportColumn, ExportSpec } from '../export/types';

export type Rendered =
  | { block: Block; type: 'table'; columns: ExportColumn[]; rows: Record<string, unknown>[] }
  | { block: Block; type: 'metrics'; items: { label: string; value: string; raw: number | string | null; error?: string }[] }
  | { block: Block; type: 'chart'; option: EChartsOption; table: [string, number][] }
  | { block: Block; type: 'summaries'; items: Company[] }
  | { block: Block; type: 'text'; body: string }
  | { block: Block; type: 'sources'; ids: string[] };

const PALETTE = ['#4B4291', '#467BAD', '#E0662E', '#34C345', '#B61483', '#4DA29D', '#C98A1E', '#999999'];

function groupAgg(cs: Company[], groupBy: string, field: string, agg: 'count' | 'sum' | 'avg' | 'median'): [string, number][] {
  const g = FIELD_BY_ID[groupBy], f = FIELD_BY_ID[field];
  const buckets = new Map<string, number[]>();
  cs.forEach((c) => {
    const k = String(g?.get(c) ?? '—');
    const v = f?.get(c);
    if (!buckets.has(k)) buckets.set(k, []);
    if (agg === 'count') buckets.get(k)!.push(1);
    else if (typeof v === 'number') buckets.get(k)!.push(v);
  });
  return [...buckets.entries()].map(([k, vs]) => [k, agg === 'count' ? vs.length : aggregateValues(agg, vs) ?? 0] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 12);
}

function chartOption(kind: 'bar' | 'line' | 'donut', title: string, data: [string, number][]): EChartsOption {
  const base: EChartsOption = { color: PALETTE, title: { text: title, left: 8, top: 4, textStyle: { fontSize: 14, fontFamily: 'Public Sans' } }, tooltip: {}, aria: { enabled: true, description: `${title}: ${data.map(([k, v]) => `${k} ${Math.round(v)}`).join(', ')}` } };
  if (kind === 'donut') return { ...base, legend: { bottom: 0, type: 'scroll' }, series: [{ type: 'pie', radius: ['45%', '70%'], data: data.map(([name, value]) => ({ name, value })), label: { formatter: '{b}: {c}' } }] };
  return { ...base, grid: { left: 60, right: 20, top: 40, bottom: 60 }, xAxis: { type: 'category', data: data.map(([k]) => k), axisLabel: { rotate: data.length > 6 ? 30 : 0 } }, yAxis: { type: 'value' }, series: [{ type: kind, data: data.map(([, v]) => Math.round(v)), itemStyle: { color: PALETTE[0] }, smooth: kind === 'line' }] };
}

export function renderBlock(b: Block, cs: Company[], countryCodes: string[]): Rendered {
  switch (b.kind) {
    case 'table': {
      const fields = b.fields.filter((f) => FIELD_BY_ID[f]);
      const sortField = fields.find((f) => FIELD_BY_ID[f].kind === 'money' || FIELD_BY_ID[f].kind === 'int');
      const sorted = sortField ? [...cs].sort((a, c) => ((FIELD_BY_ID[sortField].get(c) as number) ?? -Infinity) - ((FIELD_BY_ID[sortField].get(a) as number) ?? -Infinity)) : cs;
      return { block: b, type: 'table', columns: fields.map((f) => ({ key: f, label: FIELD_BY_ID[f].label, format: kindToFormat(FIELD_BY_ID[f].kind) })), rows: sorted.slice(0, b.limit).map((c) => Object.fromEntries(fields.map((f) => [f, FIELD_BY_ID[f].get(c)]))) };
    }
    case 'calc': {
      const ctx = { rows: cs, get: (c: Company, f: string) => FIELD_BY_ID[f]?.get(c) ?? null, series: fieldSeries };
      return {
        block: b, type: 'metrics', items: b.metrics.map((m) => {
          try {
            const raw = cs.length ? compile(m.formula, ctx, FIELD_IDS).evaluate(cs[0]) : null;
            const money = /turnover|raised|fundraising|assets|profit|cash/i.test(m.formula) && !/COUNT\(|employees\)\s*$/.test(m.formula) && !/\/ *MEDIAN\(employees\)/.test(m.formula);
            return { label: m.label, raw, value: fmtVal(raw, /COUNT\(/.test(m.formula) || /employees\)$/.test(m.formula.trim()) ? 'int' : money ? 'money' : 'calc') };
          } catch (e) { return { label: m.label, raw: null, value: '—', error: (e as Error).message }; }
        }),
      };
    }
    case 'chart': {
      const data = groupAgg(cs, b.groupBy, b.field, b.agg);
      return { block: b, type: 'chart', option: chartOption(b.chartType, b.title, data), table: data };
    }
    case 'stat': {
      let data: [string, number][];
      let kind: 'bar' | 'line' | 'donut' = 'bar';
      if (b.stat === 'by-country') data = groupAgg(cs, 'country', 'employees', 'count');
      else if (b.stat === 'by-stage') { data = groupAgg(cs, 'stage', 'employees', 'count'); kind = 'donut'; }
      else if (b.stat === 'top-raised') data = [...cs].sort((a, c) => c.fundraisingTotal - a.fundraisingTotal).slice(0, 10).map((c) => [c.name, c.fundraisingTotal]);
      else { const m = new Map<string, number>(); cs.forEach((c) => { const y = c.foundedDate.slice(0, 4); m.set(y, (m.get(y) ?? 0) + 1); }); data = [...m.entries()].sort((a, c) => a[0].localeCompare(c[0])); kind = 'line'; }
      return { block: b, type: 'chart', option: chartOption(kind, b.title, data), table: data };
    }
    case 'summaries': return { block: b, type: 'summaries', items: [...cs].sort((a, c) => c.fundraisingTotal - a.fundraisingTotal).slice(0, b.limit) };
    case 'text': return { block: b, type: 'text', body: b.body };
    case 'sources': return { block: b, type: 'sources', ids: [...new Set(countryCodes.flatMap((cc) => ['company-details', 'accounts', 'officers'].map((d) => sourceFor(d as 'accounts', cc).id)).concat(['in-house', 'credit-partner']))] };
  }
}

export function renderReport(r: Report, cs: Company[]): Rendered[] {
  const countries = [...new Set(cs.map((c) => c.country))];
  return r.blocks.map((b) => renderBlock(b, cs, countries.length ? countries : ['GB']));
}

/** Build the export spec (PDF: cover, contents, charts, tables, sources; Excel: one sheet per table/metrics block). */
export function reportSpec(r: Report, cs: Company[], chartImage: (o: EChartsOption) => string, logo?: string): ExportSpec {
  const out = renderReport(r, cs);
  const sources = (out.find((o) => o.type === 'sources') as Extract<Rendered, { type: 'sources' }> | undefined)?.ids;
  const sheets = out.flatMap((o) => {
    if (o.type === 'table') return [{ name: o.block.title.slice(0, 28), columns: o.columns, rows: o.rows }];
    if (o.type === 'metrics') return [{ name: o.block.title.slice(0, 28), columns: [{ key: 'label', label: 'Metric' }, { key: 'value', label: 'Value' }, { key: 'formula', label: 'Formula' }], rows: o.items.map((i, k) => ({ label: i.label, value: i.value, formula: (o.block as Extract<Block, { kind: 'calc' }>).metrics[k].formula })) }];
    if (o.type === 'chart') return [{ name: `${o.block.title}`.slice(0, 28), columns: [{ key: 'k', label: 'Category' }, { key: 'v', label: 'Value', format: 'ratio' as const }], rows: o.table.map(([k, v]) => ({ k, v })) }];
    if (o.type === 'summaries') return [{ name: o.block.title.slice(0, 28), columns: [{ key: 'name', label: 'Company' }, { key: 'country', label: 'Country' }, { key: 'stage', label: 'Stage' }, { key: 'description', label: 'Description', width: 70 }], rows: o.items.map((c) => ({ name: c.name, country: countryName(c.country), stage: c.stage, description: c.description })) }];
    return [];
  });
  return {
    title: r.title, subtitle: r.subtitle || undefined, author: r.author, orientation: r.orientation, cover: r.cover, toc: true,
    logoDataUrl: r.logo ? logo : undefined,
    filtersUsed: [`Scope: ${cs.length} companies`],
    text: out.filter((o) => o.type === 'text').map((o) => ({ heading: o.block.title, body: (o as Extract<Rendered, { type: 'text' }>).body })),
    charts: out.filter((o) => o.type === 'chart').map((o) => ({ title: o.block.title, dataUrl: chartImage((o as Extract<Rendered, { type: 'chart' }>).option) })),
    sheets,
    sources,
    viewPath: `/reports/${r.id}`,
  };
}
