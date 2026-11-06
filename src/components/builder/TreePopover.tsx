import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { Checkbox, TriState } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { useIsOpen, useUi } from '../../store/uiStore';
import type { TreeNode } from '../../data/taxonomies/signals';
import { SIGNAL_COLUMNS } from '../../data/taxonomies/signals';
import { bus } from '../../lib/eventBus';
import { Highlight } from './icons';

interface Props {
  id: string;
  anchor: HTMLElement | null;
  tree: TreeNode[];
  value: string[];
  onConfirm: (v: string[]) => void;
}

const leafIds = (n: TreeNode): string[] => (n.children ? n.children.flatMap(leafIds) : [n.id]);

/** Grouped tree multiselect popover with tri-state parents (Signals). */
export function TreePopover({ id, anchor, tree, value, onConfirm }: Props) {
  const isOpen = useIsOpen(id);
  const close = useUi((s) => s.close);
  const [sel, setSel] = useState<Set<string>>(new Set(value));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [term, setTerm] = useState('');

  useEffect(() => {
    if (isOpen) { setSel(new Set(value)); setTerm(''); setExpanded(new Set()); bus.emit('popover:open:signals'); }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const allLeaves = useMemo(() => tree.flatMap(leafIds), [tree]);
  const t = term.trim().toLowerCase();

  const stateOf = (ids: string[]): TriState => {
    const n = ids.filter((x) => sel.has(x)).length;
    return n === 0 ? 'off' : n === ids.length ? 'on' : 'mixed';
  };
  const setMany = (ids: string[], on: boolean) => {
    setSel((prev) => {
      const next = new Set(prev);
      ids.forEach((x) => (on ? next.add(x) : next.delete(x)));
      return next;
    });
    if (on && ids.length === 1) bus.emit(`item:check:${ids[0]}`);
  };
  const toggleExpand = (pid: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else { next.add(pid); bus.emit(`tree:expand:${pid}`); }
      return next;
    });

  const byId = new Map(tree.map((n) => [n.id, n]));
  const columns = SIGNAL_COLUMNS.map((col) => col.map((pid) => byId.get(pid)!).filter(Boolean));

  const renderParent = (p: TreeNode) => {
    const kids = (p.children ?? []).filter((k) => !t || k.label.toLowerCase().includes(t) || p.label.toLowerCase().includes(t));
    if (t && !kids.length) return null;
    const open = !!t || expanded.has(p.id);
    return (
      <div key={p.id} className="mb-[2px]">
        <div className="flex items-center gap-[4px] py-[4px]">
          <button
            onClick={() => toggleExpand(p.id)}
            data-tour={`tree-expand-${p.id}`}
            aria-label={`${open ? 'Collapse' : 'Expand'} ${p.label}`}
            aria-expanded={open}
            className="w-[20px] h-[20px] flex items-center justify-center text-text hover:text-ink"
          >
            <ChevronRight size={15} className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`} />
          </button>
          <Checkbox checked={stateOf(leafIds(p))} onChange={(on) => setMany(leafIds(p), on)} className="text-[15px] text-ink font-medium">
            {p.label}
          </Checkbox>
        </div>
        {open && (
          <div className="pl-[46px]">
            {kids.map((k) => (
              <div key={k.id} className="py-[4px]">
                <Checkbox checked={sel.has(k.id)} onChange={(on) => setMany([k.id], on)} className="text-[14px] text-ink" tourKey={`tree-item-${k.id}`}>
                  <Highlight text={k.label} term={term} />
                </Checkbox>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover id={id} anchor={anchor} width={750} className="!border-primary" tourKey="tree-popover">
      <div className="flex items-center justify-between gap-3 px-[16px] pt-[14px] pb-[10px]">
        <div className="relative w-[300px]">
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search"
            aria-label="Search signals"
            className="w-full h-[30px] border border-border rounded-btn pl-2 pr-8 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <Search size={14} className="absolute right-[9px] top-[8px] text-text pointer-events-none" />
        </div>
        <div className="inline-flex border border-primary rounded-btn overflow-hidden divide-x divide-primary">
          <button onClick={() => setExpanded(new Set(tree.map((p) => p.id)))} className="h-[28px] px-[12px] text-[14px] font-semibold text-primary hover:bg-primary-light">Expand all</button>
          <button onClick={() => setExpanded(new Set())} className="h-[28px] px-[12px] text-[14px] font-semibold text-primary hover:bg-primary-light">Collapse all</button>
        </div>
      </div>
      <div className="px-[16px] pb-[6px] border-b border-border">
        <Checkbox checked={stateOf(allLeaves)} onChange={(on) => setMany(allLeaves, on)} className="text-[14px] text-ink py-[4px]">Select all</Checkbox>
      </div>
      <div className="max-h-[330px] overflow-y-auto nb-scroll px-[12px] py-[8px] grid grid-cols-2 gap-x-[24px]">
        {columns.map((col, i) => <div key={i}>{col.map(renderParent)}</div>)}
      </div>
      <div className="flex items-center justify-between px-[16px] py-[10px] border-t border-border">
        <span className="text-[13px] text-muted">{sel.size} selected</span>
        <Button tourKey="tree-confirm" onClick={() => { onConfirm(allLeaves.filter((x) => sel.has(x))); close(id); bus.emit('tree:confirm'); }}>
          Confirm
        </Button>
      </div>
    </Popover>
  );
}
