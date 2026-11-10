import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { ChevronRight, Info } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import type { HsItem } from '../../../data/profile/types';
import { CompactSelect } from '../../../components/ui/CompactSelect';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Card, EmptyState, SectionTitle, SegmentedToggle, Tip } from '../ui';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = (m: string) => `${MON[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
type Range = 'all' | '24' | '12';

export function CommodityTrade({ p }: SectionProps) {
  const cm = p.commodities;
  const [showImp, setShowImp] = useState(true);
  const [showExp, setShowExp] = useState(true);
  const [range, setRange] = useState<Range>('all');
  const [order, setOrder] = useState<'months' | 'unique'>('months');
  const [listRange, setListRange] = useState<Range>('all');
  const [settings, setSettings] = useState(false);
  if (!cm) {
    return <><SectionTitle>Commodity Trade</SectionTitle><Card><span data-section-empty /><EmptyState title="No commodity trade recorded">We haven't found customs import or export records for this company.</EmptyState></Card></>;
  }
  const monthly = range === 'all' ? cm.monthly : cm.monthly.slice(-Number(range));
  const axisText = { fontFamily: 'Public Sans', color: '#595959', fontSize: 11 };
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['Imported commodities', 'Exported commodities'], textStyle: axisText },
    grid: { left: 60, right: 16, top: 34, bottom: 70 },
    xAxis: { type: 'category', data: monthly.map((m) => label(m.month)), axisLabel: { ...axisText, rotate: 45 } },
    yAxis: { type: 'value', minInterval: 1, name: 'Imported commodities and Exported commodities', nameLocation: 'middle', nameGap: 36, nameTextStyle: { ...axisText, fontSize: 11 }, axisLabel: axisText, splitLine: { lineStyle: { color: '#EBEBEB' } } },
    series: [
      ...(showImp ? [{ name: 'Imported commodities', type: 'line' as const, data: monthly.map((m) => m.imports), symbol: 'circle', symbolSize: 5, itemStyle: { color: '#467BAD' }, lineStyle: { color: '#467BAD' } }] : []),
      ...(showExp ? [{ name: 'Exported commodities', type: 'line' as const, data: monthly.map((m) => m.exports), symbol: 'circle', symbolSize: 5, itemStyle: { color: '#E0662E' }, lineStyle: { color: '#E0662E' } }] : []),
    ],
  };
  const totalMonths = (listRange === 'all' ? cm.monthly.length : Number(listRange));
  const scale = totalMonths / cm.monthly.length;
  const rangeOpts = [{ value: 'all', label: `${label(cm.monthly[0].month)} - ${label(cm.monthly[cm.monthly.length - 1].month)}` }, { value: '24', label: 'Last 24 months' }, { value: '12', label: 'Last 12 months' }] as { value: Range; label: string }[];

  return (
    <>
      <SectionTitle>Commodity Trade</SectionTitle>
      <div className="space-y-[16px]">
        <Card title="Unique commodities traded" tourKey="commodity-chart" actions={
          <div className="relative">
            <button onClick={() => setSettings((v) => !v)} aria-label="Chart settings" aria-expanded={settings} className="w-[28px] h-[28px] border border-primary rounded-btn text-primary hover:bg-primary-light flex items-center justify-center">⚙</button>
            {settings && (
              <div className="absolute right-0 top-[34px] z-20 w-[230px] bg-white border border-border rounded-card shadow-lg p-[12px] space-y-[8px]">
                <Checkbox checked={showImp} onChange={setShowImp} className="text-[14px]">Show imports</Checkbox>
                <Checkbox checked={showExp} onChange={setShowExp} className="text-[14px]">Show exports</Checkbox>
                <CompactSelect ariaLabel="Date range" value={range} onChange={setRange} options={rangeOpts} />
              </div>
            )}
          </div>
        }>
          <div className="flex gap-[20px] items-center">
            <div className="flex-1 min-w-0"><ReactECharts option={option} notMerge style={{ height: 340 }} /></div>
            <div className="w-[200px] shrink-0 space-y-[16px]">
              <div className="text-[14px] text-text">From {cm.monthly[0].month.slice(0, 4)} to {cm.monthly[cm.monthly.length - 1].month.slice(0, 4)}</div>
              <Ring n={cm.imports.length} color="#467BAD" text="unique imported commodities" />
              <Ring n={cm.exports.length} color="#E0662E" text="unique exported commodities" />
            </div>
          </div>
          <p className="text-[13px] text-muted mt-[6px]">Source: HMRC trade data (monthly importer and exporter records).</p>
        </Card>
        <Card title="Most traded commodities">
          <div className="flex items-center gap-[16px] mb-[14px] text-[14px] text-text">
            <CompactSelect ariaLabel="Date range" value={listRange} onChange={setListRange} options={rangeOpts} />
            <span>Order by:</span>
            <SegmentedToggle size="sm" value={order} onChange={setOrder} options={[{ value: 'months', label: 'Months traded' }, { value: 'unique', label: 'Unique commodities' }]} />
          </div>
          <div className="grid grid-cols-2 gap-[28px]">
            <TradedList title="Imports" items={cm.imports} color="#467BAD" total={totalMonths} scale={scale} order={order} />
            <TradedList title="Exports" items={cm.exports} color="#E0662E" total={totalMonths} scale={scale} order={order} />
          </div>
        </Card>
      </div>
    </>
  );
}

function Ring({ n, color, text }: { n: number; color: string; text: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className="w-[60px] h-[60px] rounded-full border-[3px] flex items-center justify-center text-[22px] font-bold text-ink shrink-0" style={{ borderColor: color }}>{n}</span>
      <span className="text-[13px] text-text">{text}</span>
    </div>
  );
}

function TradedList({ title, items, color, total, scale, order }: { title: string; items: HsItem[]; color: string; total: number; scale: number; order: 'months' | 'unique' }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const sorted = [...items].sort((a, b) => (order === 'months' ? b.months - a.months : b.sub.length - a.sub.length));
  const m = (x: number) => Math.max(1, Math.round(x * scale));
  return (
    <div>
      <div className="flex items-center justify-between border-b border-card-border pb-[6px] mb-[6px]">
        <h4 className="text-[15px] font-semibold text-ink">{title}</h4>
        <span className="text-[13px] text-text inline-flex items-center gap-[4px]">Months traded <Tip text="Number of months in the period with at least one shipment"><Info size={12} className="text-muted" /></Tip></span>
      </div>
      {!sorted.length && <p className="text-[14px] text-muted py-[10px]">No {title.toLowerCase()} recorded.</p>}
      {sorted.map((it) => (
        <div key={it.code} className="py-[6px] border-b border-card-border last:border-0">
          <button onClick={() => setOpen((s) => { const n = new Set(s); n.has(it.code) ? n.delete(it.code) : n.add(it.code); return n; })} className="w-full flex items-start gap-[6px] text-left text-[14px] text-ink">
            <ChevronRight size={14} className={`mt-[3px] shrink-0 transition-transform ${open.has(it.code) ? 'rotate-90' : ''}`} />
            <span className="flex-1">{it.code} - {it.description}</span>
          </button>
          <Bar months={m(it.months)} total={total} color={color} />
          {open.has(it.code) && it.sub.map((s) => (
            <div key={s.code} className="pl-[22px] mt-[6px] text-[13px] text-text">{s.code} - {s.description}<Bar months={m(s.months)} total={total} color={color} light /></div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Bar({ months, total, color, light = false }: { months: number; total: number; color: string; light?: boolean }) {
  return (
    <div className="flex items-center gap-[10px] mt-[4px] pl-[20px]">
      <div className="flex-1 h-[6px] bg-track rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(100, (months / total) * 100)}%`, background: color, opacity: light ? 0.6 : 1 }} /></div>
      <span className="text-[12px] text-text w-[100px] whitespace-nowrap text-right tabular-nums">{Math.min(months, total)}/{total} months</span>
    </div>
  );
}
