import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Popover } from '../../components/ui/Popover';
import { Checkbox } from '../../components/ui/Checkbox';
import { SelectButton } from '../../components/ui/CompactSelect';
import { useIsOpen, useUi } from '../../store/uiStore';

let seq = 0;

/** Generic version of part 1's list popover: "N selected ▾" button + checkbox list + OK. */
export function MultiSelect({ label, options, value, onChange, width = 320, tourKey }: {
  label: string; options: { id: string; label: string; count?: number }[]; value: string[]; onChange: (v: string[]) => void; width?: number; tourKey?: string;
}) {
  const [id] = useState(() => `ms-${seq++}`);
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const isOpen = useIsOpen(id);
  const { toggle, close } = useUi();
  const [sel, setSel] = useState<string[]>(value);
  const [filter, setFilter] = useState('');
  useEffect(() => { if (isOpen) { setSel(value); setFilter(''); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = options.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()));
  const btn = value.length === options.length ? `${value.length} selected` : value.length === 0 ? 'None selected' : value.length === 1 ? options.find((o) => o.id === value[0])?.label ?? '1 selected' : `${value.length} selected`;

  return (
    <span className="inline-flex items-center gap-[8px] text-[14px] text-text">
      {label}
      <SelectButton buttonRef={setEl} onClick={() => toggle(id)} tourKey={tourKey} ariaLabel={label}>{btn}</SelectButton>
      <Popover id={id} anchor={el} width={width}>
        <div className="flex items-center justify-between px-[14px] pt-[10px]">
          <span className="flex gap-[12px] text-[13px]">
            <button className="text-primary hover:underline" onClick={() => setSel(options.map((o) => o.id))}>Select all</button>
            <button className="text-primary hover:underline" onClick={() => setSel([])}>Clear all</button>
          </span>
          <button onClick={() => close(id)} aria-label="Close" className="text-text hover:text-ink"><X size={16} /></button>
        </div>
        <div className="px-[14px] py-[8px]">
          <input autoFocus value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter ..." aria-label="Filter options" className="w-full h-[30px] border border-border rounded-btn px-2 text-[14px] focus:outline-none focus:border-primary" />
        </div>
        <div className="max-h-[260px] overflow-y-auto nb-scroll border-y border-border">
          {shown.map((o) => (
            <div key={o.id} className="px-[14px] py-[5px] hover:bg-[#F3F3F3]">
              <Checkbox checked={sel.includes(o.id)} onChange={(on) => setSel((s) => (on ? [...s, o.id] : s.filter((x) => x !== o.id)))} className="text-[14px] text-ink w-full">
                {o.label}{o.count != null && <span className="text-muted ml-[6px]">({o.count})</span>}
              </Checkbox>
            </div>
          ))}
        </div>
        <div className="flex justify-end px-[14px] py-[10px]">
          <button onClick={() => { onChange(sel); close(id); }} className="inline-flex items-center gap-[5px] h-[30px] px-[14px] bg-primary text-white rounded-btn text-[14px] font-semibold hover:bg-primary-hover">
            <Check size={15} /> OK
          </button>
        </div>
      </Popover>
    </span>
  );
}

/** Reveal more items as a sentinel scrolls into view. */
export function useInfinite(total: number, batch = 30) {
  const [limit, setLimit] = useState(batch);
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinel) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setLimit((l) => Math.min(total, l + batch)); }, { rootMargin: '400px' });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [sentinel, total, batch]);
  return { limit, setLimit, sentinelRef: setSentinel, done: limit >= total };
}
