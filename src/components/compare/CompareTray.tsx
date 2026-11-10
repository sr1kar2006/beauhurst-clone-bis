import { Link, useLocation } from 'react-router-dom';
import { Columns3, X } from 'lucide-react';
import { useCompare, comparePath, MAX_COMPARE } from '../../store/compareStore';
import { getCompany } from '../../data/dataset';
import { Flag } from '../ui/Flag';

/** Docked tray at the bottom of the screen listing companies picked for comparison (max 6). */
export function CompareTray() {
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const clear = useCompare((s) => s.clear);
  const { pathname } = useLocation();
  if (!ids.length || pathname === '/compare') return null;
  const companies = ids.map(getCompany).filter(Boolean);
  return (
    <aside aria-label="Companies to compare" data-compare-tray className="fixed bottom-0 left-0 right-[230px] z-[45] bg-white border-t border-r border-border shadow-[0_-4px_16px_rgba(0,0,0,0.08)] rounded-tr-card no-print">
      <div className="flex items-center gap-[10px] px-[20px] h-[58px]">
        <span className="text-[14px] font-semibold text-ink whitespace-nowrap">Compare ({ids.length}/{MAX_COMPARE})</span>
        <ul className="flex items-center gap-[8px] min-w-0 overflow-x-auto">
          {companies.map((c) => (
            <li key={c!.id} className="flex items-center gap-[6px] h-[34px] pl-[6px] pr-[4px] border border-border rounded-btn bg-page shrink-0">
              <img src={c!.logo} alt="" className="w-[22px] h-[22px] rounded-[2px] border border-border" />
              <Flag code={c!.country} className="text-[13px]" />
              <span className="text-[13px] text-ink max-w-[150px] truncate">{c!.name}</span>
              <button onClick={() => remove(c!.id)} aria-label={`Remove ${c!.name} from comparison`} className="w-[22px] h-[22px] flex items-center justify-center text-text hover:text-ink"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-[8px] shrink-0">
          <button onClick={clear} className="h-[32px] px-[12px] text-[14px] font-semibold text-primary hover:underline">Clear</button>
          <Link to={comparePath(ids)} data-compare-now className="inline-flex items-center gap-[6px] h-[32px] px-[14px] rounded-btn bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover">
            <Columns3 size={15} />Compare now
          </Link>
        </div>
      </div>
    </aside>
  );
}

/** Small "Compare" toggle used on profile headers and similar companies. */
export function CompareToggle({ id, label = 'Compare', className = '' }: { id: string; label?: string; className?: string }) {
  const on = useCompare((s) => s.ids.includes(id));
  const full = useCompare((s) => s.ids.length >= MAX_COMPARE);
  const toggle = useCompare((s) => s.toggle);
  return (
    <button
      onClick={() => toggle(id)}
      disabled={!on && full}
      aria-pressed={on}
      data-compare-toggle={id}
      title={!on && full ? `You can compare up to ${MAX_COMPARE} companies` : undefined}
      className={`inline-flex items-center gap-[6px] h-[30px] px-[12px] border border-primary rounded-btn text-[14px] font-semibold disabled:opacity-50 ${on ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary-light'} ${className}`}
    >
      <Columns3 size={15} />{on ? 'In comparison' : label}
    </button>
  );
}
