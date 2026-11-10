import { Link } from 'react-router-dom';
import { Building2, ExternalLink } from 'lucide-react';
import type { NewsItem } from '../../data/profile/types';
import { NEWS_CATEGORIES } from '../../data/news';
import { getCompany } from '../../data/dataset';
import { profilePath } from '../../lib/nav';
import { formatDate } from '../../lib/format';
import { Flag } from '../ui/Flag';

export const CATEGORY_TONE: Record<string, string> = {
  'Financial results': 'bg-[#DCF3E1] text-[#1E6B34]', 'Credit changes': 'bg-[#FFF2CC] text-[#7A5B00]', 'Sector developments': 'bg-chip-blue text-badge-blue-text',
  'M&A': 'bg-[#EEEDF6] text-primary', 'Insolvency & administration': 'bg-[#FDE2E1] text-[#9B1C1C]', 'Leadership changes': 'bg-[#E3F1F0] text-[#2F6F6A]', Regulatory: 'bg-[#F6DCE6] text-[#8A2D55]',
};

/** Toggle chips for the seven news categories. */
export function CategoryChips({ value, onChange, counts }: { value: string[]; onChange: (v: string[]) => void; counts?: Record<string, number> }) {
  return (
    <div className="flex flex-wrap items-center gap-[6px]" role="group" aria-label="News categories" data-category-chips>
      <button aria-pressed={!value.length} onClick={() => onChange([])} className={`h-[28px] px-[10px] rounded-full text-[13px] font-semibold border ${!value.length ? 'bg-tab-active text-white border-tab-active' : 'bg-white text-primary border-border hover:border-primary'}`}>All</button>
      {NEWS_CATEGORIES.map((c) => {
        const on = value.includes(c);
        return (
          <button key={c} aria-pressed={on} data-category={c} onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            className={`h-[28px] px-[10px] rounded-full text-[13px] font-semibold border ${on ? 'bg-tab-active text-white border-tab-active' : 'bg-white text-primary border-border hover:border-primary'}`}>
            {c}{counts ? ` (${counts[c] ?? 0})` : ''}
          </button>
        );
      })}
    </div>
  );
}

export function NewsRows({ items, showCompany = true }: { items: NewsItem[]; showCompany?: boolean }) {
  return (
    <table className="w-full text-[14px]" data-news-table>
      <thead className="border-b border-card-border"><tr><th className="text-left py-[9px] px-[15px] font-semibold text-ink">Article</th><th className="text-left py-[9px] px-[15px] font-semibold text-ink w-[130px]">Date</th></tr></thead>
      <tbody>
        {items.map((n) => (
          <tr key={n.id} className="border-b border-card-border last:border-0 align-top" data-article={n.id}>
            <td className="py-[12px] px-[15px]">
              <a href={n.url} target="_blank" rel="noreferrer noopener" className="text-[15px] font-medium text-ink hover:text-primary hover:underline inline-flex items-center gap-[5px]" data-source-link>
                {n.headline}<ExternalLink size={13} className="text-muted" aria-label="(opens in a new tab)" />
              </a>
              <div className="text-[13px] text-muted">via <a href={n.url} target="_blank" rel="noreferrer noopener" className="hover:underline">{n.source}</a> · sample link</div>
              <div className="flex flex-wrap items-center gap-[6px] mt-[6px]">
                {(n.categories ?? []).map((c) => <span key={c} className={`px-[7px] py-[1px] rounded-full text-[11px] font-semibold ${CATEGORY_TONE[c] ?? 'bg-[#EFEFEF] text-text'}`}>{c}</span>)}
                {showCompany && n.tagged.map((id) => { const t = getCompany(id); return t ? <Link key={id} to={profilePath(id)} className="inline-flex items-center gap-[4px] text-[13px] text-primary hover:underline"><Building2 size={13} /><Flag code={t.country} className="text-[12px]" />{t.name}</Link> : null; })}
              </div>
            </td>
            <td className="py-[12px] px-[15px] text-ink">{formatDate(n.date)}</td>
          </tr>
        ))}
        {!items.length && <tr><td colSpan={2} className="py-[24px] text-center text-muted">No articles match.</td></tr>}
      </tbody>
    </table>
  );
}
