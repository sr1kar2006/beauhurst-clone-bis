import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Download, Plus, Save, Search, X } from 'lucide-react';
import { PageShell, Panel, btnOutline, btnPrimary } from '../../components/layout/PageShell';
import { SampleTag } from '../../components/ui/Sample';
import { Flag } from '../../components/ui/Flag';
import { Popover } from '../../components/ui/Popover';
import { useUi } from '../../store/uiStore';
import { useCompare, comparePath, MAX_COMPARE } from '../../store/compareStore';
import { getCompanies } from '../../data/dataset';
import { countryName } from '../../data/countries/iso3166';
import { profilePath } from '../../lib/nav';
import { formatDate, formatInt } from '../../lib/format';
import { currencySymbol, fxPerGbp } from '../../lib/money';
import { TENDER } from '../../config';
import { downloadBlob, toCsv } from '../../lib/download';
import { buildRows, bestWorst, entries, FIN_METRICS, isDifferent, periodNote, type Cell, type Kind, type Row } from '../../compare/model';
import { exportComparison } from './exportComparison';

type Cur = 'GBP' | 'EUR' | 'USD' | 'Local';
const SECTIONS = ['Overview', 'Financials', 'Ratios', 'Funding', 'Ownership', 'People', 'Risk', 'Signals'];
const COLORS = ['#4B4291', '#467BAD', '#E0662E', '#34C345', '#B61483', '#4DA29D'];

function fmtMoney(gbp: number, cur: string): string {
  const v = gbp * fxPerGbp(cur);
  const a = Math.abs(v);
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(2)}b` : a >= 1e6 ? `${(a / 1e6).toFixed(1)}m` : a >= 1e3 ? `${(a / 1e3).toFixed(0)}k` : a.toFixed(0);
  return `${v < 0 ? '-' : ''}${currencySymbol(cur)}${s}`;
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const setTray = useCompare((s) => s.set);
  const saveComparison = useCompare((s) => s.saveComparison);
  const ids = useMemo(() => (params.get('ids') ?? '').split(',').map(decodeURIComponent).filter(Boolean).slice(0, MAX_COMPARE), [params]);
  const es = useMemo(() => entries(ids), [ids]);
  const { rows, years, industry } = useMemo(() => buildRows(es), [es]);
  const [cur, setCur] = useState<Cur>('GBP');
  const [diffOnly, setDiffOnly] = useState(false);
  const [showMedian, setShowMedian] = useState(false);
  const [metric, setMetric] = useState('turnover');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { setTray(ids); }, [ids, setTray]);
  const setIds = (next: string[]) => setParams({ ids: next.join(',') }, { replace: true });

  const fmt = (v: Cell, kind: Kind, col: number | 'median'): string => {
    if (v == null || v === '') return '—';
    if (typeof v === 'string') return kind === 'date' ? formatDate(v) : v;
    switch (kind) {
      case 'money': { const c = cur === 'Local' ? (col === 'median' ? 'GBP' : es[col].c.currency) : cur; return fmtMoney(v, c); }
      case 'int': return formatInt(Math.round(v));
      case 'pct': return `${v.toFixed(1)}%`;
      case 'ratio': return v.toFixed(2);
      default: return String(v);
    }
  };

  const shown = rows.filter((r) => !diffOnly || isDifferent(r));
  const note = periodNote(es);
  const csv = () => downloadBlob(toCsv(['Section', 'Metric', ...es.map((e) => e.c.name), ...(showMedian ? ['Industry median'] : [])], shown.map((r) => [r.section, r.label, ...r.values.map((v, i) => fmt(v, r.kind, i)), ...(showMedian ? [fmt(r.median ?? null, r.kind, 'median')] : [])])), 'comparison.csv', 'text/csv;charset=utf-8');

  const chartOption = useMemo(() => {
    const m = FIN_METRICS.find((x) => x.id === metric)!;
    const ys = [...years].reverse();
    return {
      color: COLORS,
      tooltip: { trigger: 'axis' },
      legend: { top: 0, data: es.map((e) => e.c.name) },
      grid: { left: 70, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: ys.map((y) => `FY${y}`) },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (m.kind === 'money' ? fmtMoney(v, cur === 'Local' ? 'GBP' : cur) : formatInt(v)) } },
      series: es.map((e) => {
        const row = rows.filter((r) => r.id.startsWith(`fin-${metric}-`));
        return { name: e.c.name, type: chartType, data: ys.map((y) => { const r = row.find((x) => x.id === `fin-${metric}-${y}`); const v = r?.values[es.indexOf(e)]; return typeof v === 'number' ? (m.kind === 'money' ? v * fxPerGbp(cur === 'Local' ? 'GBP' : cur) : v) : null; }) };
      }),
      aria: { enabled: true, description: `${m.label} by financial year for ${es.map((e) => e.c.name).join(', ')}` },
    };
  }, [metric, chartType, es, rows, years, cur]);

  const cols = `260px repeat(${es.length}, minmax(170px, 1fr))${showMedian ? ' 150px' : ''}${es.length < MAX_COMPARE ? ' 200px' : ''}`;

  return (
    <PageShell
      title="Compare companies"
      wide
      crumbs={[{ label: 'Home', to: '/' }, { label: 'Comparisons', to: '/comparisons' }, { label: 'Compare companies' }]}
      actions={es.length ? (
        <div className="flex items-center gap-[8px]">
          <button className={btnOutline} onClick={() => { const c = saveComparison(es.map((e) => e.c.name).join(' vs ').slice(0, 80), ids); setSaved(c.name); }}><Save size={15} />Save comparison</button>
          <button className={btnOutline} onClick={csv}><Download size={15} />CSV</button>
          <button className={btnOutline} onClick={() => exportComparison('xlsx', es, shown, fmt, showMedian)} data-export-xlsx><Download size={15} />Excel</button>
          <button className={btnOutline} onClick={() => exportComparison('pdf', es, shown, fmt, showMedian)} data-export-pdf><Download size={15} />PDF</button>
        </div>
      ) : undefined}
    >
      {saved && <p role="status" className="mb-[10px] text-[14px] text-[#1E6B34]">Saved as “{saved}”. Find it under <Link to="/comparisons" className="text-primary underline">My Northbeam → Comparisons</Link>.</p>}
      {!es.length ? (
        <Panel><div className="text-center py-[30px] text-text"><p className="text-[16px] text-ink mb-[10px]">Pick up to {MAX_COMPARE} companies to compare, from any country.</p><AddCompany ids={ids} onAdd={(id) => setIds([...ids, id])} /></div></Panel>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-[14px] mb-[12px] text-[14px] text-text" data-compare-toolbar>
            <span>Currency</span>
            <div role="group" aria-label="Currency" className="inline-flex border border-primary rounded-btn overflow-hidden divide-x divide-primary">
              {(['GBP', 'EUR', 'USD', 'Local'] as Cur[]).map((k) => (
                <button key={k} aria-pressed={cur === k} data-currency={k} onClick={() => setCur(k)} className={`h-[28px] px-[12px] text-[13px] font-semibold ${cur === k ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary-light'}`}>{k}</button>
              ))}
            </div>
            <span className="text-[13px]">FX: 1 GBP = {fxPerGbp('EUR')} EUR = {fxPerGbp('USD')} USD, rates of {formatDate(TENDER.fxDate.value)}<SampleTag note={TENDER.fxPerGbp.note} /></span>
            <label className="inline-flex items-center gap-[6px] ml-auto cursor-pointer"><input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} className="accent-primary w-[16px] h-[16px]" data-diff-only />Show differences only</label>
            <label className="inline-flex items-center gap-[6px] cursor-pointer"><input type="checkbox" checked={showMedian} onChange={(e) => setShowMedian(e.target.checked)} className="accent-primary w-[16px] h-[16px]" />Industry median{industry ? ` (${industry})` : ''}</label>
          </div>
          {note && <p className="mb-[10px] text-[13px] bg-[#EEF4FB] border-l-4 border-bar-blue px-[12px] py-[8px] text-ink" data-period-note>{note}</p>}

          <div className="bg-white border border-card-border rounded-card" role="table" aria-label="Company comparison" data-compare-table>
            <div role="row" className="grid sticky top-[84px] z-20 bg-white border-b border-border rounded-t-card" style={{ gridTemplateColumns: cols }}>
              <div role="columnheader" className="px-[14px] py-[12px] text-[13px] text-muted self-end">{es.length} companies</div>
              {es.map((e) => (
                <div key={e.c.id} role="columnheader" className="px-[12px] py-[10px] border-l border-card-border" data-compare-col={e.c.id}>
                  <div className="flex items-start gap-[8px]">
                    <img src={e.c.logo} alt="" className="w-[32px] h-[32px] rounded-[3px] border border-border" />
                    <div className="min-w-0 flex-1">
                      <Link to={profilePath(e.c.id)} className="block text-[15px] font-semibold text-primary hover:underline truncate">{e.c.name}</Link>
                      <div className="text-[12px] text-text flex items-center gap-[4px]"><Flag code={e.c.country} className="text-[13px]" />{countryName(e.c.country)} · {e.c.stage}</div>
                    </div>
                    <button onClick={() => setIds(ids.filter((x) => x !== e.c.id))} aria-label={`Remove ${e.c.name}`} className="text-text hover:text-ink"><X size={15} /></button>
                  </div>
                </div>
              ))}
              {showMedian && <div role="columnheader" className="px-[12px] py-[12px] border-l border-card-border text-[13px] font-semibold text-ink self-end">Industry median</div>}
              {es.length < MAX_COMPARE && <div role="columnheader" aria-label="Add a company" className="px-[12px] py-[10px] border-l border-card-border"><AddCompany ids={ids} onAdd={(id) => setIds([...ids, id])} /></div>}
            </div>
            {SECTIONS.map((sec) => {
              const rs = shown.filter((r) => r.section === sec);
              if (!rs.length) return null;
              return (
                <Fragment key={sec}>
                  <div role="row" className="px-[14px] py-[8px] bg-[#F4F4F7] border-b border-card-border text-[14px] font-semibold text-ink" data-compare-section={sec}><span role="rowheader">{sec}</span></div>
                  {sec === 'Financials' && (
                    <div role="row" className="px-[14px] py-[12px] border-b border-card-border"><div role="cell">
                      <div className="flex items-center gap-[10px] mb-[6px] text-[14px]">
                        <label className="inline-flex items-center gap-[6px]">Metric
                          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="h-[28px] border border-border rounded-btn px-2 bg-white" data-metric-picker>
                            {FIN_METRICS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                          </select>
                        </label>
                        <div role="group" aria-label="Chart type" className="inline-flex border border-border rounded-btn overflow-hidden">
                          {(['bar', 'line'] as const).map((t) => <button key={t} aria-pressed={chartType === t} onClick={() => setChartType(t)} className={`h-[28px] px-[10px] text-[13px] ${chartType === t ? 'bg-tab-active text-white' : 'bg-white text-ink'}`}>{t === 'bar' ? 'Grouped bars' : 'Lines'}</button>)}
                        </div>
                        <span className="text-[12px] text-muted">{cur === 'Local' ? 'Chart in GBP (mixed local currencies cannot share an axis).' : `Chart in ${cur}.`}</span>
                      </div>
                      <ReactECharts option={chartOption} notMerge style={{ height: 260 }} />
                    </div></div>
                  )}
                  {rs.map((r) => <CompareRow key={r.id} r={r} cols={cols} fmt={fmt} showMedian={showMedian} addCol={es.length < MAX_COMPARE} />)}
                </Fragment>
              );
            })}
          </div>
          <p className="text-[12px] text-muted mt-[8px]">Best and worst values in each row are tinted green and red. Money is converted from GBP at sample rates.</p>
        </>
      )}
    </PageShell>
  );
}

function CompareRow({ r, cols, fmt, showMedian, addCol }: { r: Row; cols: string; fmt: (v: Cell, k: Kind, col: number | 'median') => string; showMedian: boolean; addCol: boolean }) {
  const bw = bestWorst(r);
  return (
    <div role="row" className="grid border-b border-card-border last:border-0 text-[14px]" style={{ gridTemplateColumns: cols }} data-compare-row={r.id}>
      <div role="rowheader" className="px-[14px] py-[8px] text-text">{r.label}</div>
      {r.values.map((v, i) => {
        const tone = bw?.best === i ? 'bg-[#E3F5E7]' : bw?.worst === i ? 'bg-[#FCE8E7]' : '';
        let content: React.ReactNode = fmt(v, r.kind, i);
        if (r.highlight?.size && typeof v === 'string') {
          content = v.split(', ').map((n, k) => <Fragment key={n}>{k > 0 && ', '}{r.highlight!.has(n) ? <mark className="bg-[#FFF2CC] px-[2px] rounded-[2px]" title="Also a director of another company in this comparison">{n}</mark> : n}</Fragment>);
        }
        return <div key={i} role="cell" data-tone={bw?.best === i ? 'best' : bw?.worst === i ? 'worst' : undefined} className={`px-[12px] py-[8px] border-l border-card-border text-ink ${r.kind === 'text' || r.kind === 'date' ? '' : 'text-right tabular-nums'} ${tone}`}>{content}</div>;
      })}
      {showMedian && <div role="cell" className="px-[12px] py-[8px] border-l border-card-border text-right tabular-nums text-text">{r.median == null ? '—' : fmt(r.median, r.kind, 'median')}</div>}
      {addCol && <div role="cell" className="border-l border-card-border" />}
    </div>
  );
}

let seq = 0;
function AddCompany({ ids, onAdd }: { ids: string[]; onAdd: (id: string) => void }) {
  const [id] = useState(() => `cmp-add-${seq++}`);
  const [term, setTerm] = useState('');
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const open = useUi((s) => s.open);
  const close = useUi((s) => s.close);
  const matches = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (t.length < 2) return [];
    const out = [];
    for (const c of getCompanies()) { if (!ids.includes(c.id) && c.name.toLowerCase().includes(t)) out.push(c); if (out.length >= 8) break; }
    return out;
  }, [term, ids]);
  return (
    <div ref={setEl} className="relative">
      <label className="sr-only" htmlFor={id}>Add a company to compare</label>
      <Plus size={14} className="absolute left-[8px] top-[9px] text-text" aria-hidden />
      <input id={id} value={term} data-compare-add onChange={(e) => { setTerm(e.target.value); e.target.value.trim().length >= 2 ? open(id) : close(id); }} placeholder="Add company (any country)" className="w-full h-[32px] border border-border rounded-btn pl-[26px] pr-[8px] text-[13px] focus:outline-none focus:border-primary" />
      <Popover id={id} anchor={el} width={300} caret={false} className="py-1">
        {matches.length ? matches.map((c) => (
          <button key={c.id} onClick={() => { onAdd(c.id); setTerm(''); close(id); }} className="w-full text-left flex items-center gap-2 px-3 py-[6px] hover:bg-page text-[14px]">
            <img src={c.logo} alt="" className="w-5 h-5 border border-border rounded-[2px]" /><span className="truncate flex-1">{c.name}</span><Flag code={c.country} className="text-[13px]" />
          </button>
        )) : <div className="px-3 py-2 text-[14px] text-muted"><Search size={13} className="inline mr-1" />No companies match “{term}”</div>}
      </Popover>
    </div>
  );
}

export function ComparisonsPage() {
  const saved = useCompare((s) => s.saved);
  const del = useCompare((s) => s.deleteSaved);
  const ids = useCompare((s) => s.ids);
  return (
    <PageShell title="Comparisons" crumbs={[{ label: 'Home', to: '/' }, { label: `My ${'Northbeam'}` }, { label: 'Comparisons' }]} actions={<Link to={comparePath(ids)} className={btnPrimary}>New comparison</Link>}>
      <Panel bodyClass="">
        <ul data-saved-comparisons>
          {saved.map((s) => (
            <li key={s.id} className="flex items-center gap-[12px] px-[18px] py-[12px] border-b border-card-border last:border-0">
              <div className="flex-1 min-w-0">
                <Link to={comparePath(s.ids)} className="text-[15px] font-semibold text-primary hover:underline">{s.name}</Link>
                <div className="text-[13px] text-muted">{s.ids.length} companies · saved {formatDate(s.created)}</div>
              </div>
              <button onClick={() => del(s.id)} className="text-[13px] text-text hover:text-ink">Delete</button>
            </li>
          ))}
          {!saved.length && <li className="px-[18px] py-[20px] text-text">No saved comparisons yet.</li>}
        </ul>
      </Panel>
    </PageShell>
  );
}
