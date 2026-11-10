import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Award, Banknote, FileText, Gift, Rocket, Search, Star, X } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import type { TimelineEvent, TimelineType } from '../../../data/profile/types';
import { STAGE_COLORS } from '../../../data/taxonomies/misc';
import { formatLongDate, formatMonthYear } from '../../../lib/format';
import { Card, SectionTitle, Segs, TypeBadge, BadgeTone } from '../ui';
import { MiniTimeline } from '../shared';
import { MultiSelect, useInfinite } from '../MultiSelect';

export const TIMELINE_TONE: Record<TimelineType, BadgeTone> = {
  News: 'blue', 'Person added': 'green', 'Person removed': 'green', Resolution: 'green', 'Stage of evolution': 'orange',
  'New fundraising': 'pink', Grant: 'pink', 'High growth list': 'pink', Accelerator: 'pink', Establishment: 'pink',
  Incorporation: 'grey', Capital: 'green', Accounts: 'green',
};
const SIG_ICON: Partial<Record<TimelineType, typeof Banknote>> = { 'New fundraising': Banknote, Grant: Gift, 'High growth list': Award, Accelerator: Rocket, Establishment: Star };
const SPINE: Record<string, string> = { ...STAGE_COLORS, Established: '#282828' };

export function Timeline({ c, p }: SectionProps) {
  const types = useMemo(() => [...new Set(p.timeline.map((e) => e.type))].sort(), [p]);
  const [selected, setSelected] = useState<string[]>(types);
  const events = p.timeline.filter((e) => selected.includes(e.type));
  const { limit, setLimit, sentinelRef, done } = useInfinite(events.length, 30);
  const [detail, setDetail] = useState<TimelineEvent | null>(null);
  const [jump, setJump] = useState<string | null>(null);

  // after a mini-timeline click: make sure the event is rendered, then scroll to it
  useEffect(() => {
    if (!jump) return;
    const idx = events.findIndex((e) => e.id === jump);
    if (idx >= limit) { setLimit(idx + 10); return; }
    const el = document.getElementById(`ev-${jump}`);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 282;
      window.scrollTo({ top: y, behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-primary');
      setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 1600);
    }
    setJump(null);
  }, [jump, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  let lastMonth = '';
  return (
    <>
      <SectionTitle>Timeline</SectionTitle>
      <div className="sticky top-[140px] z-20 -mx-[2px] px-[2px] pb-[10px] bg-page">
        <Card bodyClass="py-[8px]"><MiniTimeline p={p} onSelect={(e) => { if (!selected.includes(e.type)) setSelected([...selected, e.type]); setJump(e.id); }} /></Card>
      </div>
      <div className="flex items-center justify-between my-[12px]">
        <MultiSelect label="Filter" options={types.map((t) => ({ id: t, label: t, count: p.timeline.filter((e) => e.type === t).length }))} value={selected} onChange={setSelected} tourKey="timeline-filter" />
        <span className="text-[14px] text-muted">{events.length} events since {formatLongDate(p.altEstablishmentDate)}</span>
      </div>

      <div className="relative" data-tour="timeline-feed">
        {events.slice(0, limit).map((e, i) => {
          const month = formatMonthYear(e.date);
          const showMonth = month !== lastMonth;
          lastMonth = month;
          const left = i % 2 === 0;
          const color = SPINE[e.stage];
          const isLast = i === Math.min(limit, events.length) - 1;
          return (
            <Fragment key={e.id}>
              {showMonth && (
                <div className="relative grid grid-cols-[1fr_64px_1fr] h-[40px]">
                  <div /><div className="relative flex justify-center"><span className="absolute inset-y-0 w-[3px]" style={{ background: color }} /></div><div />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-border rounded-full px-[10px] py-[2px] text-[12px] text-text whitespace-nowrap z-[1]">{month}</span>
                </div>
              )}
              <div className="relative grid grid-cols-[1fr_64px_1fr] items-center">
                <div className={left ? 'flex justify-end py-[8px]' : ''}>{left && <EventCard e={e} onDetail={setDetail} />}</div>
                <div className="relative flex justify-center self-stretch">
                  <span className="absolute inset-y-0 w-[3px]" style={{ background: isLast && done ? `linear-gradient(${color}, ${color}33)` : color }} />
                  <span className={`absolute top-1/2 -translate-y-1/2 h-px w-[22px] bg-[#C9C9C9] ${left ? 'right-1/2' : 'left-1/2'}`} />
                  <Node e={e} />
                </div>
                <div className={!left ? 'py-[8px]' : ''}>{!left && <EventCard e={e} onDetail={setDetail} />}</div>
              </div>
            </Fragment>
          );
        })}
        {!done && <div ref={sentinelRef} className="text-center py-[16px]"><button onClick={() => setLimit(limit + 30)} className="text-primary text-[14px] hover:underline">Load more</button></div>}
        {!events.length && <p className="text-center text-muted py-[30px]">No events match this filter.</p>}
      </div>
      {detail && <EventDrawer e={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

function Node({ e }: { e: TimelineEvent }) {
  if (e.significant) {
    const Icon = SIG_ICON[e.type] ?? Star;
    return <span className="relative z-[1] w-[28px] h-[28px] rounded-full bg-money-yellow border-2 border-white shadow flex items-center justify-center self-center"><Icon size={14} className="text-ink" /></span>;
  }
  if (e.type === 'News') return <span className="relative z-[1] w-[28px] h-[28px] rounded-full bg-chip-blue border-2 border-white flex items-center justify-center self-center"><FileText size={13} className="text-badge-blue-text" /></span>;
  return <span className="relative z-[1] w-[10px] h-[10px] rounded-full bg-[#BDBDBD] border-2 border-white self-center" />;
}

function EventCard({ e, onDetail }: { e: TimelineEvent; onDetail: (e: TimelineEvent) => void }) {
  return (
    <article id={`ev-${e.id}`} className={`relative w-full max-w-[485px] bg-white rounded-[4px] shadow-[0_1px_4px_rgba(0,0,0,0.12)] px-[14px] py-[10px] transition-shadow ${e.significant ? 'border-2 border-money-yellow' : 'border border-card-border'}`}>
      <div className="flex items-center gap-[8px] pr-[30px]">
        <TypeBadge tone={TIMELINE_TONE[e.type]}>{e.type}</TypeBadge>
        <span className="text-[13px] font-bold text-ink">{formatLongDate(e.date)}</span>
      </div>
      <p className="text-[14px] text-text mt-[6px]"><Segs parts={e.parts} /></p>
      {e.sub && <p className="text-[13px] text-text mt-[2px]"><Segs parts={e.sub} /></p>}
      {e.significant && (
        <button onClick={() => onDetail(e)} aria-label="Event details" className="absolute top-[8px] right-[8px] w-[24px] h-[24px] border border-border rounded-btn flex items-center justify-center text-text hover:border-primary hover:text-primary">
          <Search size={13} />
        </button>
      )}
    </article>
  );
}

function EventDrawer({ e, onClose }: { e: TimelineEvent; onClose: () => void }) {
  useEffect(() => {
    const k = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[65] bg-black/30" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()} data-layer-ignore>
      <aside role="dialog" aria-label="Event details" className="absolute right-0 top-0 h-full w-[420px] bg-white shadow-xl p-[22px] animate-fadein">
        <div className="flex items-start justify-between mb-[14px]">
          <div><TypeBadge tone={TIMELINE_TONE[e.type]}>{e.type}</TypeBadge><h2 className="text-[18px] text-ink font-semibold mt-[6px]">{formatLongDate(e.date)}</h2></div>
          <button autoFocus onClick={onClose} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
        </div>
        <p className="text-[14px] text-text mb-[14px]"><Segs parts={e.parts} /></p>
        <dl className="text-[14px]">
          {(e.detail ?? []).map(([k, v]) => <div key={k} className="flex py-[7px] border-b border-card-border"><dt className="w-[45%] text-text">{k}</dt><dd className="text-ink">{v}</dd></div>)}
          <div className="flex py-[7px]"><dt className="w-[45%] text-text">Stage at the time</dt><dd className="text-ink">{e.stage}</dd></div>
        </dl>
      </aside>
    </div>,
    document.body,
  );
}
