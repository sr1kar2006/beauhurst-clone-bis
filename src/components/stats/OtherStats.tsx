import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { Company } from '../../data/types';
import * as S from '../../stats/compute';
import { formatInt, formatMoney } from '../../lib/format';
import { ChartCard, FaqLink } from './ChartCard';
import { HBarList, KpiPill, donutOption, hbarOption } from './primitives';
import { SectionTitle } from './StatsDashboard';
import { C } from './CompaniesStats';

const axisText = { fontFamily: 'Public Sans', color: '#595959', fontSize: 12 };

function quarterBar(labels: string[], values: number[], color: string, yName: string, money = false): EChartsOption {
  return {
    tooltip: { trigger: 'axis', valueFormatter: (v) => (money ? formatMoney(Number(v)) : formatInt(Number(v))) },
    grid: { left: 70, right: 20, top: 20, bottom: 80 },
    xAxis: { type: 'category', data: labels, axisLabel: { ...axisText, rotate: 45, interval: 0 } },
    yAxis: { type: 'value', name: yName, nameLocation: 'middle', nameGap: 52, axisLabel: { ...axisText, formatter: (v: number) => (money ? formatMoney(v) || '0' : formatInt(v)) }, splitLine: { lineStyle: { color: '#EBEBEB' } } },
    series: [{ type: 'bar', data: values, itemStyle: { color } }],
  };
}

export function FundraisingStats({ results }: { results: Company[] }) {
  const q = useMemo(() => S.fundraisingsByQuarter(results), [results]);
  const investors = useMemo(() => S.topInvestors(results), [results]);
  const stages = useMemo(() => S.dealStages(results), [results]);
  const deals = results.reduce((s, c) => s + c.fundraisings.length, 0);
  const total = results.reduce((s, c) => s + c.fundraisingTotal, 0);
  const dealsOpt = quarterBar(q.map((x) => x.label), q.map((x) => x.deals), C.blue, 'Deals');
  const amountOpt = quarterBar(q.map((x) => x.label), q.map((x) => x.amount), C.mint, 'Amount raised', true);
  const stageColors: Record<string, string> = { Seed: '#50A198', Venture: '#3F7DB6', Growth: '#B61483' };
  const stageOpt = donutOption(stages.map((s) => ({ name: s.label, value: s.value, color: stageColors[s.label] })));

  return (
    <>
      <SectionTitle>Overview</SectionTitle>
      <ChartCard title="Summary of fundraisings" csv={{ headers: ['Metric', 'Value'], rows: [['Deals', deals], ['Total raised (£)', total]] }}>
        <div className="grid grid-cols-3 gap-[10px]">
          <KpiPill value={formatInt(deals)} caption="Number of fundraisings" />
          <KpiPill value={formatMoney(total) || '£0'} caption="Total amount raised" />
          <KpiPill value={formatMoney(deals ? total / deals : 0) || '£0'} caption="Average deal size" />
        </div>
      </ChartCard>
      <div className="mt-[18px] space-y-[18px]">
        <ChartCard title="Number of fundraisings per quarter" option={dealsOpt} csv={{ headers: ['Quarter', 'Deals'], rows: q.map((x) => [x.label, x.deals]) }} footnote={<>Only fundraisings we have verified are counted. See the <FaqLink />.</>}>
          <ReactECharts option={dealsOpt} notMerge style={{ height: 340 }} />
        </ChartCard>
        <ChartCard title="Amount raised per quarter" option={amountOpt} csv={{ headers: ['Quarter', 'Amount raised (£)'], rows: q.map((x) => [x.label, x.amount]) }}>
          <ReactECharts option={amountOpt} notMerge style={{ height: 340 }} />
        </ChartCard>
      </div>
      <SectionTitle>Investors and stages</SectionTitle>
      <div className="grid grid-cols-2 gap-[18px] items-start">
        <ChartCard title="Most active investors" option={hbarOption('Most active investors', investors.map((i) => i.label), investors.map((i) => i.value), C.blue)} csv={{ headers: ['Investor', 'Deals'], rows: investors.map((i) => [i.label, i.value]) }} footnote="Counted by number of deals with companies in your results.">
          <HBarList variant="stacked" color={C.blue} items={investors.map((i) => ({ key: i.label, label: <span className="text-primary">{i.label}</span>, value: i.value, text: `${formatInt(i.value)} deals` }))} />
        </ChartCard>
        <ChartCard title="Stage of deal" option={stageOpt} csv={{ headers: ['Stage', 'Deals'], rows: stages.map((s) => [s.label, s.value]) }}>
          <ReactECharts option={stageOpt} notMerge style={{ height: 320 }} />
        </ChartCard>
      </div>
    </>
  );
}

export function MboStats({ results }: { results: Company[] }) {
  const mbo = useMemo(() => S.mboCompanies(results), [results]);
  const years = useMemo(() => S.mbosByYear(results), [results]);
  const regions = useMemo(() => S.byRegion(mbo), [mbo]);
  const yearOpt = quarterBar(years.map((y) => y.label), years.map((y) => y.value), C.magenta, 'MBOs/MBIs');
  return (
    <>
      <SectionTitle>Overview</SectionTitle>
      <ChartCard title="Summary of MBOs/MBIs" csv={{ headers: ['Metric', 'Value'], rows: [['Companies with an MBO/MBI', mbo.length]] }}>
        <div className="grid grid-cols-3 gap-[10px]">
          <KpiPill value={formatInt(mbo.length)} caption="Companies with an MBO/MBI" />
          <KpiPill value={`${results.length ? ((mbo.length / results.length) * 100).toFixed(1) : 0}%`} caption="Share of companies in your results" />
          <KpiPill value={formatInt(regions.length)} caption="Regions represented" />
        </div>
      </ChartCard>
      {mbo.length === 0 ? (
        <p className="mt-[18px] text-text">None of the companies in your results have a recorded MBO or MBI.</p>
      ) : (
        <div className="mt-[18px] grid grid-cols-2 gap-[18px] items-start">
          <ChartCard title="MBOs/MBIs per year" option={yearOpt} csv={{ headers: ['Year', 'MBOs/MBIs'], rows: years.map((y) => [y.label, y.value]) }}>
            <ReactECharts option={yearOpt} notMerge style={{ height: 320 }} />
          </ChartCard>
          <ChartCard title="MBOs/MBIs by head office region" option={hbarOption('MBOs by region', regions.map((r) => r.label), regions.map((r) => r.value), C.blue)} csv={{ headers: ['Region', 'Companies'], rows: regions.map((r) => [r.label, r.value]) }}>
            <HBarList labelWidth={190} color={C.blue} items={regions.map((r) => ({ key: r.label, label: r.label, value: r.value, text: formatInt(r.value) }))} />
          </ChartCard>
        </div>
      )}
    </>
  );
}
