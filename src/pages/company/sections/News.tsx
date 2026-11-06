import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import { getCompany } from '../../../data/dataset';
import { formatDate, formatInt } from '../../../lib/format';
import { profilePath } from '../../../lib/nav';
import { Card, Pager, SectionTitle } from '../ui';

export function News({ p }: SectionProps) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const shown = p.news.slice((page - 1) * size, page * size);
  return (
    <>
      <SectionTitle>News</SectionTitle>
      <div className="flex items-center justify-between mb-[10px] text-[14px] text-text">
        <span>Showing <strong className="text-ink">{shown.length} of {formatInt(p.news.length)}</strong> related company news articles found</span>
        <Pager total={p.news.length} page={page} size={size} onPage={(n) => { setPage(n); window.scrollTo(0, 0); }} onSize={(n) => { setSize(n); setPage(1); }} />
      </div>
      <Card bodyClass="p-0">
        <table className="w-full text-[14px]">
          <thead className="border-b border-card-border"><tr><th className="text-left py-[9px] px-[15px] font-semibold text-ink">Article</th><th className="text-left py-[9px] px-[15px] font-semibold text-ink w-[130px]">Date</th></tr></thead>
          <tbody>
            {shown.map((n) => (
              <tr key={n.id} className="border-b border-card-border last:border-0 align-top">
                <td className="py-[14px] px-[15px]">
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[15px] font-medium text-ink hover:text-primary hover:underline">{n.headline}</a>
                  <div className="text-[13px] text-muted">via {n.source}</div>
                  <div className="flex flex-wrap gap-x-[14px] gap-y-[2px] mt-[6px]">
                    {n.tagged.map((id) => { const t = getCompany(id); return t ? <Link key={id} to={profilePath(id)} className="inline-flex items-center gap-[4px] text-[13px] text-primary hover:underline"><Building2 size={13} />{t.name}</Link> : null; })}
                  </div>
                </td>
                <td className="py-[14px] px-[15px] text-ink">{formatDate(n.date)}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={2} className="py-[24px] text-center text-muted">No news for this company yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
