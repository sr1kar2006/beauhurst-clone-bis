import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Popover } from './Popover';
import { useIsOpen, useUi } from '../../store/uiStore';
import { allCountries, countryByCode, PINNED_COUNTRIES, type Country } from '../../data/countries/iso3166';
import { bus } from '../../lib/eventBus';

interface Props {
  mode: 'single' | 'multi';
  /** selected ISO-2 codes; [] means "All countries" when allowAll */
  value: string[];
  onChange: (codes: string[]) => void;
  allowAll?: boolean;
  /** accessible name of the trigger, e.g. "Countries" */
  label: string;
  tourKey?: string;
  /** visual size of the trigger */
  size?: 'sm' | 'md';
  /** optional per-country counts shown as a hint */
  counts?: Record<string, number>;
  className?: string;
  /** icon-only trigger (flag or globe + count), for tight spaces like the header search */
  compact?: boolean;
}

let seq = 0;

export function countrySummary(codes: string[], allowAll = true): string {
  if (!codes.length) return allowAll ? 'All countries' : 'Select a country';
  if (codes.length <= 2) return codes.map((c) => countryByCode(c).name).join(', ');
  return `${codes.length} countries`;
}

/**
 * Country dropdown: every ISO 3166-1 country with flag and search, United Kingdom and Ireland pinned first,
 * a divider, then A to Z. Combobox + listbox semantics, arrow keys / Home / End / Enter / Space, typeahead.
 */
export function CountrySelect({ mode, value, onChange, allowAll = mode === 'multi', label, tourKey, size = 'sm', counts, className = '', compact = false }: Props) {
  const [id] = useState(() => `country-select-${seq++}`);
  const listId = useId();
  const isOpen = useIsOpen(id);
  const toggle = useUi((s) => s.toggle);
  const close = useUi((s) => s.close);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { if (isOpen) { setFilter(''); setActive(0); } }, [isOpen]);

  const rows = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const list = allCountries().filter((c) => !f || c.name.toLowerCase().includes(f) || c.code.toLowerCase() === f);
    const out: ({ kind: 'all' } | { kind: 'country'; c: Country; dividerBefore: boolean })[] = [];
    if (allowAll && !f) out.push({ kind: 'all' });
    list.forEach((c, i) => out.push({ kind: 'country', c, dividerBefore: !f && i === PINNED_COUNTRIES.length }));
    return out;
  }, [filter, allowAll]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const pick = (row: (typeof rows)[number]) => {
    if (row.kind === 'all') { onChange([]); if (mode === 'single') close(id); return; }
    const code = row.c.code;
    if (mode === 'single') { onChange([code]); close(id); bus.emit(`country:pick:${code}`); return; }
    onChange(value.includes(code) ? value.filter((x) => x !== code) : [...value, code]);
    bus.emit(`country:pick:${code}`);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(rows.length - 1); }
    else if (e.key === 'Enter' || (e.key === ' ' && mode === 'multi' && !filter)) { e.preventDefault(); if (rows[active]) pick(rows[active]); }
    else if (e.key === 'Tab') close(id);
  };

  const summary = countrySummary(value, allowAll);
  const first = value[0] ? countryByCode(value[0]) : null;
  const h = size === 'sm' ? 'h-[28px] text-[14px]' : 'h-[32px] text-[14px]';
  const optId = (i: number) => `${listId}-opt-${i}`;

  return (
    <>
      <button
        ref={setAnchor}
        type="button"
        data-tour={tourKey}
        data-country-select
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label}: ${summary}`}
        title={`${label}: ${summary}`}
        onClick={() => toggle(id)}
        className={`inline-flex items-center gap-[6px] bg-white border border-border rounded-btn px-2 ${h} text-ink hover:border-[#c8c8c8] max-w-[280px] ${className}`}
      >
        {value.length === 1 && first ? <span aria-hidden>{first.flag}</span> : <Globe size={14} className="text-text shrink-0" aria-hidden />}
        {compact ? (value.length > 1 && <span className="text-[12px] font-semibold">{value.length}</span>) : <span className="truncate">{summary}</span>}
        <ChevronDown size={14} className="text-text shrink-0" aria-hidden />
      </button>
      <Popover id={id} anchor={anchor} width={320} caret={false} tourKey={tourKey ? `${tourKey}-popover` : undefined}>
        <div className="p-[10px] border-b border-border">
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={rows[active] ? optId(active) : undefined}
            aria-label={`Search ${label.toLowerCase()}`}
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setActive(0); }}
            onKeyDown={onKey}
            placeholder="Type a country …"
            className="w-full h-[30px] border border-border rounded-btn px-2 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-multiselectable={mode === 'multi'} aria-label={label} className="max-h-[300px] overflow-y-auto nb-scroll py-[4px]">
          {rows.map((row, i) => {
            const selected = row.kind === 'all' ? value.length === 0 : value.includes(row.c.code);
            return (
              <li key={row.kind === 'all' ? '__all' : row.c.code} role="presentation">
                {row.kind === 'country' && row.dividerBefore && <div role="separator" className="my-[4px] border-t border-border" />}
                <div
                  id={optId(i)}
                  role="option"
                  aria-selected={selected}
                  data-idx={i}
                  data-country={row.kind === 'all' ? 'ALL' : row.c.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setActive(i); pick(row); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex items-center gap-[8px] px-[12px] h-[32px] text-[14px] cursor-pointer ${i === active ? 'bg-primary-light' : ''} ${selected ? 'text-primary font-semibold' : 'text-ink'}`}
                >
                  {mode === 'multi' && (
                    <span aria-hidden className={`w-[15px] h-[15px] rounded-[2px] border flex items-center justify-center ${selected ? 'bg-primary border-primary' : 'border-[#9a9a9a] bg-white'}`}>
                      {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </span>
                  )}
                  {row.kind === 'all' ? <><Globe size={15} className="text-text" aria-hidden /> All countries</> : <><span aria-hidden>{row.c.flag}</span><span className="truncate">{row.c.name}</span></>}
                  {row.kind === 'country' && counts?.[row.c.code] != null && <span className="ml-auto text-[12px] text-muted">{counts[row.c.code].toLocaleString('en-GB')}</span>}
                  {mode === 'single' && selected && <Check size={14} className="ml-auto text-primary" aria-hidden />}
                </div>
              </li>
            );
          })}
          {!rows.length && <li className="px-[12px] py-[8px] text-[14px] text-muted">No countries match “{filter}”</li>}
        </ul>
        {mode === 'multi' && (
          <div className="flex items-center justify-between px-[12px] py-[8px] border-t border-border">
            <span className="text-[13px] text-muted">{value.length ? `${value.length} selected` : 'All countries'}</span>
            <button onClick={() => close(id)} className="h-[28px] px-[12px] bg-primary text-white rounded-btn text-[13px] font-semibold hover:bg-primary-hover">Done</button>
          </div>
        )}
      </Popover>
    </>
  );
}
