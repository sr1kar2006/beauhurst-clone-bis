import type { Company } from '../../data/types';
import { useResults } from '../../store/resultsStore';
import type { StatsTab } from '../../store/resultsStore';
import { formatInt } from '../../lib/format';
import { ENTITY_LABELS } from '../builder/entity';
import { CompaniesStats } from './CompaniesStats';
import { FundraisingStats, MboStats } from './OtherStats';

const SUBTABS: { id: StatsTab; label: string }[] = [
  { id: 'companies', label: 'Companies' },
  { id: 'fundraisings', label: 'Fundraisings' },
  { id: 'mbos', label: 'MBOs/MBIs' },
];

export function StatsDashboard({ results }: { results: Company[] }) {
  const sub = useResults((s) => s.statsTab);
  const setSub = useResults((s) => s.setStatsTab);
  const entity = useResults((s) => s.ranQuery?.entity ?? 'companies');

  return (
    <div className="max-w-content mx-auto">
      <div className="flex items-center gap-[4px]" role="tablist" data-tour="stats-subtabs">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={sub === t.id}
            onClick={() => setSub(t.id)}
            className={`h-[30px] px-[14px] text-[14px] rounded-btn border ${sub === t.id ? 'bg-tab-active border-tab-active text-white font-semibold' : 'bg-white border-border text-ink hover:bg-page'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-[16px] mb-[18px] text-[18px] text-ink font-light">
        Statistics for the {formatInt(results.length)} {ENTITY_LABELS[entity].plural} in your search results
      </p>
      {results.length === 0 ? (
        <div className="bg-surface border border-border rounded-card py-[40px] text-center text-text">There are no results to summarise.</div>
      ) : sub === 'companies' ? (
        <CompaniesStats results={results} />
      ) : sub === 'fundraisings' ? (
        <FundraisingStats results={results} />
      ) : (
        <MboStats results={results} />
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-[20px] text-ink font-semibold mt-[28px] mb-[12px] first:mt-0">{children}</h2>;
}
