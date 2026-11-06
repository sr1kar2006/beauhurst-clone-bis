import { ReactNode } from 'react';
import type { EChartsOption } from 'echarts';

export function KpiPill({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-[8px]">
      <div className="min-w-[150px] px-[18px] py-[10px] border-2 border-tour-yellow rounded-full text-[24px] font-bold text-ink leading-none">{value}</div>
      <div className="text-[13px] text-text max-w-[180px] leading-snug">{caption}</div>
    </div>
  );
}

export interface HBarItem { label: ReactNode; text: string; value: number; color?: string; key: string }

/** Horizontal bars on a light track. 'inline' = label | bar | value; 'stacked' = label above bar. */
export function HBarList({ items, max, color = '#467BAD', variant = 'inline', labelWidth = 220 }: { items: HBarItem[]; max?: number; color?: string; variant?: 'inline' | 'stacked'; labelWidth?: number }) {
  const m = max ?? Math.max(1, ...items.map((i) => i.value));
  if (variant === 'stacked') {
    return (
      <div className="space-y-[10px]">
        {items.map((i) => (
          <div key={i.key}>
            <div className="text-[14px] text-ink mb-[3px] truncate">{i.label}</div>
            <div className="flex items-center gap-[10px]">
              <div className="flex-1 h-[16px] bg-track rounded-[2px] overflow-hidden">
                <div className="h-full rounded-[2px]" style={{ width: `${(i.value / m) * 100}%`, background: i.color ?? color }} />
              </div>
              <span className="text-[13px] text-ink min-w-[64px] shrink-0 whitespace-nowrap text-right tabular-nums">{i.text}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-[9px]">
      {items.map((i) => (
        <div key={i.key} className="flex items-center gap-[12px]">
          <div className="text-[14px] text-ink shrink-0 truncate" style={{ width: labelWidth }}>{i.label}</div>
          <div className="flex-1 h-[16px] bg-track rounded-[2px] overflow-hidden">
            <div className="h-full rounded-[2px]" style={{ width: `${(i.value / m) * 100}%`, background: i.color ?? color }} />
          </div>
          <span className="text-[14px] text-ink w-[60px] text-right tabular-nums">{i.text}</span>
        </div>
      ))}
    </div>
  );
}

/** Export-only horizontal bar option for HTML-rendered cards. */
export function hbarOption(title: string, labels: string[], values: number[], color: string): EChartsOption {
  return {
    title: { text: title, left: 10, top: 6, textStyle: { fontSize: 14, fontFamily: 'Public Sans' } },
    grid: { left: 10, right: 60, top: 40, bottom: 10, containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#EBEBEB' } } },
    yAxis: { type: 'category', data: [...labels].reverse(), axisTick: { show: false } },
    series: [{ type: 'bar', data: [...values].reverse(), itemStyle: { color }, barWidth: 14, label: { show: true, position: 'right' } }],
  };
}

export function LegendList({ items }: { items: { label: string; value: number; color: string }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-[20px] gap-y-[5px] mt-[10px] text-[14px]">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-[8px]">
          <span className="w-[12px] h-[12px] shrink-0" style={{ background: i.color }} />
          <span className="text-ink">{i.label}</span>
          <span className="ml-auto text-text tabular-nums">{i.value.toLocaleString('en-GB')}</span>
        </li>
      ))}
    </ul>
  );
}

export function InlineSelect<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-[28px] border border-border rounded-btn px-[6px] text-[14px] text-ink bg-white focus:outline-none focus:border-primary"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/** Thin donut with outside leader-line labels in coloured boxes. */
export function donutOption(data: { name: string; value: number; color: string }[], opts: { radius?: [string, string] } = {}): EChartsOption {
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'rect', itemWidth: 12, itemHeight: 12, textStyle: { fontFamily: 'Public Sans', fontSize: 13, color: '#595959' } },
    series: [{
      type: 'pie',
      radius: opts.radius ?? ['50%', '55%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      minShowLabelAngle: 2,
      data: data.filter((d) => d.value > 0).map((d) => ({
        name: d.name, value: d.value, itemStyle: { color: d.color },
        label: { color: ['#CCCCCC', '#F3E105', '#999999', '#FADD1D'].includes(d.color.toUpperCase()) ? '#282828' : '#fff' },
      })),
      label: {
        show: true,
        position: 'outside',
        formatter: '{b}: {c}',
        overflow: 'none',
        edgeDistance: 6,
        color: '#fff',
        backgroundColor: 'inherit',
        padding: [3, 6],
        borderRadius: 2,
        fontFamily: 'Public Sans',
        fontSize: 12,
      },
      labelLine: { show: true, length: 14, length2: 12, lineStyle: { width: 1 } },
    }],
  };
}
