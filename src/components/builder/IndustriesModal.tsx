import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { useIsOpen, useUi } from '../../store/uiStore';
import { INDUSTRY_GROUPS, IndustryGroup, findGroup, itemsInGroup, INDUSTRY_ITEMS } from '../../data/taxonomies/industries';
import { bus } from '../../lib/eventBus';
import { Highlight } from './icons';

interface Props { id: string; value: string[]; onConfirm: (v: string[]) => void }

/** Large "Industries and buzzwords" picker modal. */
export function IndustriesModal({ id, value, onConfirm }: Props) {
  const isOpen = useIsOpen(id);
  const close = useUi((s) => s.close);
  const [sel, setSel] = useState<Set<string>>(new Set(value));
  const [group, setGroup] = useState('all');
  const [drill, setDrill] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  const [showBuzz, setShowBuzz] = useState(true);
  const [showInd, setShowInd] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setSel(new Set(value)); setGroup('all'); setDrill(null); setTerm('');
      bus.emit('modal:open:industries');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = term.trim().toLowerCase();
  const leftGroups: { g: IndustryGroup; indent: boolean }[] = useMemo(() => {
    if (drill) {
      const parent = findGroup(drill)!;
      return [{ g: parent, indent: false }, ...(parent.children ?? []).map((g) => ({ g, indent: true }))];
    }
    return INDUSTRY_GROUPS.filter((g) => !t || g.id === 'all' || g.label.toLowerCase().includes(t) || itemsInGroup(g.id).some((i) => i.label.toLowerCase().includes(t)))
      .map((g) => ({ g, indent: false }));
  }, [drill, t]);

  const items = useMemo(
    () => itemsInGroup(group).filter((i) => (i.type === 'industry' ? showInd : showBuzz) && (!t || i.label.toLowerCase().includes(t) || findGroup(group)?.label.toLowerCase().includes(t))),
    [group, showBuzz, showInd, t],
  );

  const allOn = items.length > 0 && items.every((i) => sel.has(i.id));
  const someOn = items.some((i) => sel.has(i.id));

  const toggle = (iid: string, on: boolean) => {
    setSel((prev) => { const n = new Set(prev); on ? n.add(iid) : n.delete(iid); return n; });
    if (on) bus.emit(`item:check:${iid}`);
  };
  const selectGroup = (gid: string) => { setGroup(gid); bus.emit(`industries:group:${gid}`); };

  const confirm = () => {
    onConfirm(INDUSTRY_ITEMS.filter((i) => sel.has(i.id)).map((i) => i.id));
    close(id);
    bus.emit('modal:confirm');
  };

  return (
    <Modal id={id} width={1150} label="Industries and buzzwords" tourKey="industries-modal">
      <div className="flex items-center gap-[22px] px-[22px] py-[16px] border-b border-border">
        <div className="relative w-[420px]">
          <input
            data-autofocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search groups, industries and buzzwords"
            aria-label="Search groups, industries and buzzwords"
            className="w-full h-[34px] border border-border rounded-btn pl-3 pr-9 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-primary"
          />
          <Search size={16} className="absolute right-[10px] top-[9px] text-text pointer-events-none" />
        </div>
        <Checkbox checked={showBuzz} onChange={setShowBuzz} className="text-[15px] text-ink">Show buzzwords</Checkbox>
        <Checkbox checked={showInd} onChange={setShowInd} className="text-[15px] text-ink">Show industries</Checkbox>
        <button onClick={() => close(id)} aria-label="Close" className="ml-auto text-text hover:text-ink"><X size={22} /></button>
      </div>

      <div className="flex h-[470px]">
        <div className="w-[400px] border-r border-border overflow-y-auto nb-scroll py-[6px]">
          {drill && (
            <button onClick={() => { setDrill(null); }} className="w-full flex items-center gap-[6px] px-[18px] py-[8px] text-[15px] text-primary hover:bg-[#F0F0F0]">
              <ChevronLeft size={15} /> Back
            </button>
          )}
          {leftGroups.map(({ g, indent }) => {
            const active = group === g.id;
            const canDrill = !drill && !!g.children?.length;
            return (
              <div key={g.id} className={`flex items-stretch ${active ? 'bg-tab-active text-white' : 'text-primary hover:bg-[#F0F0F0]'}`}>
                <button
                  data-tour={`ind-group-${g.id}`}
                  onClick={() => selectGroup(g.id)}
                  className={`flex-1 text-left py-[8px] text-[15px] ${indent ? 'pl-[34px]' : 'pl-[18px]'} pr-2`}
                >
                  <Highlight text={g.label} term={drill ? '' : term} />
                </button>
                {canDrill && (
                  <button
                    onClick={() => { setDrill(g.id); selectGroup(g.id); }}
                    aria-label={`Open ${g.label}`}
                    className={`px-[14px] ${active ? 'text-white' : 'text-text'}`}
                  >
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-[20px] py-[10px] border-b border-border">
            <Checkbox checked={allOn ? 'on' : someOn ? 'mixed' : 'off'} onChange={(on) => items.forEach((i) => toggle(i.id, on))} className="text-[15px] text-ink font-medium">
              Select all
            </Checkbox>
          </div>
          <div className="flex-1 overflow-y-auto nb-scroll py-[4px]">
            {items.map((i) => (
              <div key={i.id} className="px-[20px] py-[5px] hover:bg-[#F3F3F3]">
                <Checkbox checked={sel.has(i.id)} onChange={(on) => toggle(i.id, on)} className="text-[15px] text-ink w-full" tourKey={`ind-item-${i.id}`}>
                  <Highlight text={i.label} term={term} />
                  {i.type === 'buzzword' && <span className="ml-2 text-[11px] uppercase tracking-wide text-muted">buzzword</span>}
                </Checkbox>
              </div>
            ))}
            {!items.length && <div className="px-[20px] py-4 text-[14px] text-muted">Nothing matches your search.</div>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-[22px] py-[14px] border-t border-border">
        <span className="text-[14px] text-muted">{sel.size} selected</span>
        <Button tourKey="ind-confirm" disabled={sel.size === 0} onClick={confirm}>Confirm</Button>
      </div>
    </Modal>
  );
}
