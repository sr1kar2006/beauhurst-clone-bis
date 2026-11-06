import { useMemo, useState } from 'react';
import type { SectionProps } from '../CompanyPage';
import type { ActivityItem, ActivityType } from '../../../data/profile/types';
import { formatLongDate } from '../../../lib/format';
import { BadgeTone, SectionTitle, Segs, TypeBadge } from '../ui';
import { MultiSelect, useInfinite } from '../MultiSelect';

const TONE: Record<ActivityType, BadgeTone> = {
  News: 'blue', 'Person added': 'green', 'Person removed': 'green', 'Officers/Directors': 'green', Capital: 'green', Resolution: 'green',
  'Accounts/Financials': 'green', 'Credit rating': 'green',
  'Fundraising valuation changed': 'red', 'Fundraising amount added': 'red', 'Fundraising source added': 'red',
};

export function RecentActivity({ p }: SectionProps) {
  const types = useMemo(() => [...new Set(p.activity.map((a) => a.type))].sort(), [p]);
  const [selected, setSelected] = useState<string[]>(types);
  const items = p.activity.filter((a) => selected.includes(a.type));
  const groups = useMemo(() => {
    const m = new Map<string, ActivityItem[]>();
    items.forEach((a) => m.set(a.added, [...(m.get(a.added) ?? []), a]));
    return [...m];
  }, [items]);
  const { limit, sentinelRef, done } = useInfinite(groups.length, 15);

  return (
    <>
      <SectionTitle>Recent Activity</SectionTitle>
      <div className="mb-[14px]">
        <MultiSelect label="Filter" options={types.map((t) => ({ id: t, label: t, count: p.activity.filter((a) => a.type === t).length }))} value={selected} onChange={setSelected} />
      </div>
      <div className="bg-surface border border-card-border rounded-card">
        {groups.slice(0, limit).map(([added, rows]) => (
          <div key={added} className="flex gap-[20px] px-[16px] py-[14px] border-b border-card-border last:border-0">
            <div className="w-[240px] shrink-0 text-right text-[14px] text-muted pt-[2px]">Added {formatLongDate(added)}</div>
            <div className="flex-1 space-y-[9px]">
              {rows.map((a) => (
                <div key={a.id} className="flex gap-[14px] items-start">
                  <div className="w-[210px] shrink-0 text-right"><TypeBadge tone={TONE[a.type]}>{a.type}</TypeBadge></div>
                  <p className="flex-1 text-[14px] text-text">
                    <span className="[&_span]:text-primary"><Segs parts={a.parts} /></span>
                    <span className="text-muted"> {formatLongDate(a.eventDate)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!groups.length && <p className="text-center text-muted py-[30px]">No recent activity matches this filter.</p>}
      </div>
      {!done && <div ref={sentinelRef} className="py-[16px] text-center text-[14px] text-muted">Loading more…</div>}
    </>
  );
}
