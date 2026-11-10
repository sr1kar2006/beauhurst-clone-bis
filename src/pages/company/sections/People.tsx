import { formatDate } from '../../../lib/format';
import { ProvenanceInfo } from '../provenance';
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { User } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import type { Person } from '../../../data/profile/types';
import { formatShortMonthDate } from '../../../lib/format';
import { PROFILE_TODAY } from '../../../data/profile/generateProfile';
import { Card, CopyButton, LinkedInIcon, Pager, PersonLink, SectionTitle } from '../ui';
import { KeyPeopleCard } from '../shared';

const th = 'py-[9px] px-[10px] text-left text-[14px] font-semibold text-ink border-b border-card-border';
const td = 'py-[9px] px-[10px] text-[14px] border-b border-card-border';

export function People({ c, p }: SectionProps) {
  const all = [...p.people.directors, ...p.people.previousDirectors].sort((a, b) => (a.appointed! < b.appointed! ? -1 : 1));
  return (
    <>
      <SectionTitle>People</SectionTitle>
      <div className="space-y-[16px]">
        <KeyPeopleCard c={c} p={p} />
        <Card title={<>Current directors<ProvenanceInfo dataset="officers" label="Directors" /></>}>
          <DirectorTable rows={p.people.directors} />
        </Card>
        <Card title="Directors over time">
          {all.length ? <ReactECharts option={dumbbell(all)} notMerge style={{ height: Math.max(160, all.length * 26 + 60) }} /> : <p className="text-muted text-[14px]">No director history.</p>}
        </Card>
        <Card title="People with Significant Control">
          {p.people.psc.length ? (
            <table className="w-full" data-people-psc><thead><tr><th className={th}>Name</th><th className={th}>Nature of control</th><th className={th}>Notified</th><th className={th}>Ceased</th></tr></thead>
              <tbody>{p.people.psc.map((x) => <tr key={x.id}><td className={td}><PersonLink name={x.name} /></td><td className={td}>{x.position}</td><td className={td}>{x.appointed ? formatDate(x.appointed) : '—'}</td><td className={td}>{x.resigned ? formatDate(x.resigned) : '—'}</td></tr>)}</tbody></table>
          ) : <p className="text-[14px] text-text">No individuals are registered as having significant control over this company. Corporate owners are shown on the <a href={`/companies/${c.id}/ownership`} className="text-primary underline">Ownership</a> tab.</p>}
        </Card>
        <Card title="Current secretaries">
          {p.people.secretaries.length ? (
            <table className="w-full"><thead><tr><th className={th}>Name</th><th className={th}>Age</th><th className={th}>Email</th><th className={th}>Appointment date</th></tr></thead>
              <tbody>{p.people.secretaries.map((s) => <tr key={s.id}><td className={td}><PersonLink name={s.name} /></td><td className={td}>—</td><td className={td}>—</td><td className={td}>{formatShortMonthDate(s.appointed)}</td></tr>)}</tbody></table>
          ) : <p className="text-[14px] text-muted">No current secretaries.</p>}
        </Card>
        <PreviousKeyPeople rows={p.people.previousKeyPeople} />
        <Card title="Previous directors">
          <DirectorTable rows={p.people.previousDirectors} previous />
        </Card>
        <Card title="Gender Pay Gap">
          <p className="text-[14px] text-text">This company has not published a gender pay gap report. Companies with 250 or more employees must report each year: <a href="#" onClick={(e) => e.preventDefault()} className="text-primary underline">see the government's gender pay gap service ↗</a>.</p>
        </Card>
      </div>
    </>
  );
}

function DirectorTable({ rows, previous = false }: { rows: Person[]; previous?: boolean }) {
  if (!rows.length) return <p className="text-[14px] text-muted">{previous ? 'No previous directors.' : 'No current directors.'}</p>;
  return (
    <table className="w-full">
      <thead><tr><th className={th}>Name</th><th className={th}>LinkedIn</th><th className={th}>Age</th>{!previous && <th className={th}>Email</th>}<th className={th}>Appointment date</th>{previous && <th className={th}>Resignation date</th>}</tr></thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id}>
            <td className={td}><PersonLink name={d.name} degree={d.degree} /></td>
            <td className={td}><LinkedInIcon known={d.linkedin} /></td>
            <td className={td}>{d.age ?? '—'}</td>
            {!previous && <td className={td}>{d.email ? <span className="inline-flex items-center gap-[6px]">{d.email}<CopyButton text={d.email} /></span> : '—'}</td>}
            <td className={td}>{formatShortMonthDate(d.appointed)}</td>
            {previous && <td className={td}>{formatShortMonthDate(d.resigned)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PreviousKeyPeople({ rows }: { rows: Person[] }) {
  const [page, setPage] = useState(1);
  const size = 20;
  return (
    <Card title="Previous key people" actions={<Pager total={rows.length} page={page} size={size} onPage={setPage} />}>
      <table className="w-full">
        <thead><tr><th className={th}>Name</th><th className={th}>Position</th><th className={th}>Function</th><th className={th}>Email</th></tr></thead>
        <tbody>
          {rows.slice((page - 1) * size, page * size).map((x) => (
            <tr key={x.id}>
              <td className={td}><span className="inline-flex items-center gap-[6px]"><PersonLink name={x.name} degree={x.degree} /><User size={13} className="text-muted" /><LinkedInIcon known={x.linkedin} /></span></td>
              <td className={td}>{x.position}</td><td className={`${td} text-text`}>{x.fn}</td><td className={`${td} text-muted`}>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function dumbbell(rows: Person[]): EChartsOption {
  const today = new Date(PROFILE_TODAY).getTime();
  const data = rows.map((d, i) => [i, new Date(d.appointed!).getTime(), d.resigned ? new Date(d.resigned).getTime() : today, d.name, d.resigned ? 1 : 0]);
  const axisText = { fontFamily: 'Public Sans', color: '#595959', fontSize: 12 };
  return {
    grid: { left: 170, right: 30, top: 10, bottom: 30 },
    tooltip: { formatter: (x: unknown) => { const v = (x as { value: (number | string)[] }).value; return `${v[3]}<br/>${new Date(v[1] as number).toLocaleDateString('en-GB')} – ${v[4] ? new Date(v[2] as number).toLocaleDateString('en-GB') : 'today'}`; } },
    xAxis: { type: 'time', axisLabel: { ...axisText, formatter: '{yyyy}' }, splitLine: { lineStyle: { color: '#EBEBEB' } } },
    yAxis: { type: 'category', data: rows.map((d) => d.name), inverse: true, axisLabel: { ...axisText, color: '#282828' }, axisTick: { show: false } },
    series: [{
      type: 'custom',
      encode: { x: [1, 2], y: 0 },
      data,
      renderItem: (_params: unknown, api: { value: (i: number) => number; coord: (v: number[]) => number[] }) => {
        const y = api.value(0);
        const s = api.coord([api.value(1), y]);
        const e = api.coord([api.value(2), y]);
        const dot = (x: number, yy: number) => ({ type: 'circle', shape: { cx: x, cy: yy, r: 5 }, style: { fill: '#fff', stroke: '#467BAD', lineWidth: 2 } });
        return { type: 'group', children: [{ type: 'line', shape: { x1: s[0], y1: s[1], x2: e[0], y2: e[1] }, style: { stroke: '#467BAD', lineWidth: 3 } }, dot(s[0], s[1]), dot(e[0], e[1])] };
      },
    } as never],
  };
}
