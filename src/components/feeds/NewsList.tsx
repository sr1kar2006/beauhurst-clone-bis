import { useMemo, useState } from 'react';
import type { Company } from '../../data/types';
import { Rng } from '../../data/rng';
import { formatDate, formatMoney } from '../../lib/format';
import { industryLabels } from '../results/cells';
import { useResults } from '../../store/resultsStore';
import { Button } from '../ui/Button';

const SOURCES = ['The Business Ledger', 'Tech Dispatch UK', 'Startup Weekly', 'Regional Enterprise News', 'Capital Markets Daily', 'Innovation Review'];

interface Story { id: string; company: Company; date: string; source: string; headline: string; snippet: string }

function storiesFor(c: Company, i: number): Story[] {
  const r = new Rng(i * 7919 + 13);
  const out: Story[] = [];
  const industry = industryLabels(c)[0] ?? 'technology';
  const f = c.fundraisings[c.fundraisings.length - 1];
  if (f) {
    out.push({
      id: `${c.id}-n1`, company: c, date: f.date, source: r.pick(SOURCES),
      headline: `${c.name} secures ${formatMoney(f.amount)} to accelerate growth`,
      snippet: `The ${c.headOffice}-based ${industry.toLowerCase()} business closed a ${f.stage.toLowerCase()} round led by ${f.investors[0]}, and plans to expand its team.`,
    });
  }
  if (r.chance(0.5)) {
    out.push({
      id: `${c.id}-n2`, company: c, date: c.events[0]?.date ?? c.foundedDate, source: r.pick(SOURCES),
      headline: r.pick([`${c.name} named one to watch in ${industry}`, `${c.name} launches new product for UK customers`, `${c.name} opens new office in ${c.headOffice}`, `How ${c.name} is changing ${industry.toLowerCase()}`]),
      snippet: c.description,
    });
  }
  return out;
}

export function NewsList({ results }: { results: Company[]; plural?: string }) {
  const [limit, setLimit] = useState(12);
  const openProfile = useResults((s) => s.openProfile);
  const stories = useMemo(
    () => results.slice(0, 600).flatMap((c, i) => storiesFor(c, i)).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [results],
  );
  return (
    <div className="max-w-content mx-auto">
      <p className="text-[14px] text-muted mb-[14px]">Latest coverage of companies in your search results</p>
      <div className="grid grid-cols-3 gap-[16px]">
        {stories.slice(0, limit).map((s) => (
          <article key={s.id} className="bg-surface border border-border rounded-card p-[16px] flex flex-col gap-[8px]">
            <div className="flex items-center gap-[8px] text-[12px] text-muted">
              <span className="font-semibold text-text">{s.source}</span>·<span>{formatDate(s.date)}</span>
            </div>
            <h3 className="text-[16px] text-ink font-semibold leading-snug">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary hover:underline">{s.headline}</a>
            </h3>
            <p className="text-[14px] text-text line-clamp-3">{s.snippet}</p>
            <button onClick={() => openProfile(s.company.id)} className="mt-auto flex items-center gap-[8px] text-[13px] text-primary hover:underline">
              <img src={s.company.logo} alt="" className="w-[22px] h-[22px] border border-border rounded-[2px]" />
              {s.company.name}
            </button>
          </article>
        ))}
      </div>
      {!stories.length && <p className="bg-surface border border-border rounded-card py-[30px] text-center text-text">No news for these companies yet.</p>}
      {stories.length > limit && <div className="text-center mt-[16px]"><Button variant="outline" onClick={() => setLimit((l) => l + 12)}>Load more</Button></div>}
    </div>
  );
}
