import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageShell, Panel, th, td } from '../../components/layout/PageShell';
import { REQUIREMENTS, type Priority, type Status } from '../../tender/requirements';
import { useTour } from '../../store/tourStore';
import { TOURS } from '../../components/tour/steps';
import { TenderExtras } from './TenderExtras';

const PRIORITY_TONE: Record<Priority, string> = { Critical: 'bg-[#FDE2E1] text-[#9B1C1C]', High: 'bg-[#FFE9D2] text-[#8A4B08]', Medium: 'bg-chip-blue text-badge-blue-text' };
const STATUS_TONE: Record<Status, string> = { Done: 'bg-[#DCF3E1] text-[#1E6B34]', Partial: 'bg-[#FFF2CC] text-[#7A5B00]', Planned: 'bg-[#EFEFEF] text-text' };

export default function TenderCoveragePage() {
  const [priority, setPriority] = useState<Priority | 'All'>('All');
  const startTour = useTour((s) => s.start);
  const rows = useMemo(() => REQUIREMENTS.filter((r) => priority === 'All' || r.priority === priority), [priority]);
  const done = REQUIREMENTS.filter((r) => r.status === 'Done').length;
  const partial = REQUIREMENTS.filter((r) => r.status === 'Partial').length;

  return (
    <PageShell
      title="Tender coverage"
      wide
      intro={<>Every gap raised in the review of the prototype against the CMA tender, and where to see it. Use the <strong>Show me</strong> links in order as the demo script (also in <code>docs/DEMO_SCRIPT.md</code>).</>}
    >
      <div className="flex items-center gap-[10px] mb-[14px]" role="group" aria-label="Filter by priority">
        {(['All', 'Critical', 'High', 'Medium'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            aria-pressed={priority === p}
            className={`h-[30px] px-[12px] rounded-full text-[14px] font-medium border ${priority === p ? 'bg-tab-active text-white border-tab-active' : 'bg-white text-primary border-border hover:border-primary'}`}
          >
            {p}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-[14px] text-text">{done} done · {partial} partial · {REQUIREMENTS.length} requirements</span>
      </div>
      <Panel bodyClass="">
        <table className="w-full border-collapse" data-tender-table>
          <thead>
            <tr>
              <th className={th}>Area</th><th className={th}>Requirement</th><th className={th}>Priority</th>
              <th className={th}>Milestone</th><th className={th}>Status</th><th className={th}>Demo</th><th className={th}><span className="sr-only">Link</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} data-req={r.id}>
                <td className={`${td} whitespace-nowrap font-semibold`}>{r.area}</td>
                <td className={td}>{r.requirement}</td>
                <td className={td}><span className={`px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${PRIORITY_TONE[r.priority]}`}>{r.priority}</span></td>
                <td className={td}>{r.milestone}</td>
                <td className={td}><span className={`px-[8px] py-[2px] rounded-full text-[12px] font-semibold ${STATUS_TONE[r.status]}`}>{r.status}</span></td>
                <td className={`${td} text-text text-[13px]`}>{r.demo}</td>
                <td className={`${td} whitespace-nowrap`}>
                  <Link
                    to={r.show}
                    data-show-me={r.id}
                    onClick={() => {
                      if (!r.tour) return;
                      const i = TOURS.findIndex((t) => t.id === r.tour);
                      if (i >= 0) setTimeout(() => startTour(i), 400);
                    }}
                    className="inline-flex items-center gap-[4px] text-primary font-semibold text-[14px] hover:underline"
                  >
                    Show me <ArrowRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <TenderExtras />
    </PageShell>
  );
}
