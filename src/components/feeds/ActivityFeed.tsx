import { useMemo, useState } from 'react';
import { Award, Banknote, FileText, UserPlus } from 'lucide-react';
import type { Company } from '../../data/types';
import { formatDate, formatMoney } from '../../lib/format';
import { useResults } from '../../store/resultsStore';
import { Button } from '../ui/Button';

type Kind = 'fundraising' | 'event' | 'director' | 'filing';
interface Item { key: string; date: string; kind: Kind; company: Company; text: string }

const ICON: Record<Kind, JSX.Element> = {
  fundraising: <Banknote size={16} className="text-bar-green" />,
  event: <Award size={16} className="text-bar-magenta" />,
  director: <UserPlus size={16} className="text-bar-blue" />,
  filing: <FileText size={16} className="text-muted" />,
};
const FILTERS: { id: Kind | 'all'; label: string }[] = [
  { id: 'all', label: 'All activity' }, { id: 'fundraising', label: 'Fundraisings' }, { id: 'director', label: 'People' }, { id: 'event', label: 'Events' }, { id: 'filing', label: 'Filings' },
];

export function buildActivity(results: Company[]): Item[] {
  const items: Item[] = [];
  results.forEach((c) => {
    c.fundraisings.forEach((f, i) => items.push({ key: `${c.id}-f${i}`, date: f.date, kind: 'fundraising', company: c, text: `raised ${formatMoney(f.amount)} in a ${f.stage.toLowerCase()} round from ${f.investors.join(', ')}` }));
    c.events.forEach((e, i) => items.push({ key: `${c.id}-e${i}`, date: e.date, kind: 'event', company: c, text: `significant event: ${e.type.toLowerCase()}` }));
    c.directors.forEach((d, i) => {
      items.push({ key: `${c.id}-d${i}`, date: d.appointed, kind: 'director', company: c, text: `appointed ${d.name} as a director` });
      if (d.resigned) items.push({ key: `${c.id}-r${i}`, date: d.resigned, kind: 'director', company: c, text: `${d.name} resigned as a director` });
    });
    if (c.hasFullFinancials) items.push({ key: `${c.id}-a`, date: `${c.latestFundraisingDate?.slice(0, 4) ?? '2024'}-06-30`, kind: 'filing', company: c, text: 'filed full accounts at Companies House' });
  });
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function ActivityFeed({ results }: { results: Company[]; plural?: string }) {
  const [filter, setFilter] = useState<Kind | 'all'>('all');
  const [limit, setLimit] = useState(40);
  const openProfile = useResults((s) => s.openProfile);
  const all = useMemo(() => buildActivity(results), [results]);
  const shown = (filter === 'all' ? all : all.filter((i) => i.kind === filter));

  let lastMonth = '';
  return (
    <div className="max-w-content mx-auto">
      <div className="flex items-center gap-[6px] mb-[16px]">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setLimit(40); }}
            className={`h-[30px] px-[14px] text-[14px] rounded-btn border ${filter === f.id ? 'bg-tab-active border-tab-active text-white font-semibold' : 'bg-white border-border text-ink hover:bg-page'}`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[14px] text-muted">{shown.length.toLocaleString('en-GB')} updates</span>
      </div>
      <div className="bg-surface border border-border rounded-card">
        {shown.slice(0, limit).map((i) => {
          const month = new Date(i.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
          const header = month !== lastMonth ? (lastMonth = month) : null;
          return (
            <div key={i.key}>
              {header && <div className="px-[20px] py-[8px] bg-page border-b border-border text-[13px] font-semibold text-ink">{header}</div>}
              <div className="flex items-start gap-[12px] px-[20px] py-[11px] border-b border-border">
                <span className="mt-[2px]">{ICON[i.kind]}</span>
                <img src={i.company.logo} alt="" className="w-[28px] h-[28px] border border-border rounded-[2px]" />
                <p className="flex-1 text-[14px] text-text">
                  <button onClick={() => openProfile(i.company.id)} className="font-semibold text-ink hover:text-primary hover:underline">{i.company.name}</button> {i.text}
                </p>
                <span className="text-[13px] text-muted whitespace-nowrap">{formatDate(i.date)}</span>
              </div>
            </div>
          );
        })}
        {!shown.length && <p className="px-[20px] py-[30px] text-center text-text">No recent activity for these companies.</p>}
      </div>
      {shown.length > limit && <div className="text-center mt-[14px]"><Button variant="outline" onClick={() => setLimit((l) => l + 40)}>Load more</Button></div>}
    </div>
  );
}
