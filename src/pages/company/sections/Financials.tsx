import { useState } from 'react';
import { Check, Download, Minus, Plus } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import type { FinValue } from '../../../data/profile/types';
import { FIN_TABLES, FinLine } from '../../../data/profile/financials';
import { formatAccounting, formatDate, formatInt } from '../../../lib/format';
import { downloadBlob, toCsv } from '../../../lib/download';
import { Button } from '../../../components/ui/Button';
import { Card, EmptyState, InfoBar, SectionTitle, Tip } from '../ui';
import { FinancialSummary } from '../shared';

function fmt(line: FinLine, v: FinValue): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? '✓' : '✗';
  if (typeof v === 'string') return v;
  switch (line.kind) {
    case 'ratio': return v.toFixed(2);
    case 'pct': return v < 0 ? `(${Math.abs(v).toFixed(2)})` : v.toFixed(2);
    case 'int': return formatInt(v);
    default: return formatAccounting(v);
  }
}

export function Financials({ c, p }: SectionProps) {
  const [allYears, setAllYears] = useState(false);
  const years = [...p.financials].reverse(); // newest first
  const shown = allYears ? years.slice(0, 5) : years.slice(0, 2);

  const download = () => {
    const rows = FIN_TABLES.flatMap((t) => [[`— ${t.title} —`, ...years.map(() => '')], ...t.lines.map((l) => [l.label, ...years.map((y) => {
      const v = y.values[l.id];
      return typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v ?? '';
    })])]);
    downloadBlob(toCsv(['Line', ...years.map((y) => y.yearEnd)], rows as (string | number)[][]), `${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-financial-statements.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <>
      <SectionTitle actions={years.length ? <Button onClick={download}><Download size={15} />Download financial statements</Button> : undefined}>Financials</SectionTitle>
      {!years.length ? (
        <Card><EmptyState title="No financial statements">This company files micro-entity or dormant accounts, so we don't have full financials.</EmptyState></Card>
      ) : (
        <div className="space-y-[16px]">
          <FinancialSummary p={p} tourKey="financial-summary" />
          <InfoBar>All financials figures are in <strong>GBP</strong></InfoBar>
          {FIN_TABLES.map((t) => (
            <Card key={t.id} title={t.title} actions={years.length > 2 ? (
              <button onClick={() => setAllYears((v) => !v)} className="inline-flex items-center gap-[4px] text-[14px] font-semibold text-primary hover:underline">
                {allYears ? <><Minus size={14} />fewer years</> : <><Plus size={14} />more years</>}
              </button>
            ) : undefined} bodyClass="p-0">
              <table className="w-full text-[14px]" data-fin-table={t.id}>
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-[8px] px-[15px] w-[260px]" />
                    {shown.map((y) => <th key={y.yearEnd} className="text-right py-[8px] px-[15px] font-semibold text-ink">{formatDate(y.yearEnd)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {t.lines.map((l) => (
                    <tr key={l.id} className={`border-b border-card-border last:border-0 ${l.subtotal ? 'bg-subtotal font-semibold' : ''}`}>
                      <th scope="row" className="text-left font-inherit py-[7px] px-[15px] align-top">
                        <Tip text={l.tip}><span className={`border-b border-dotted border-text cursor-help ${l.subtotal ? 'text-ink font-semibold' : 'text-text font-normal'}`}>{l.label}</span></Tip>
                      </th>
                      {shown.map((y) => <td key={y.yearEnd} className="text-right py-[7px] px-[15px] tabular-nums text-ink">{l.kind === 'bool' && y.values[l.id] ? <Check size={15} className="inline text-delta-up" /> : fmt(l, y.values[l.id])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
