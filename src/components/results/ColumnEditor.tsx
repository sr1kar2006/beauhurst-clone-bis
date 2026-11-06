import { useState } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { Checkbox } from '../ui/Checkbox';
import { useUi } from '../../store/uiStore';
import { ALL_COLUMNS, ColumnId, useResults } from '../../store/resultsStore';

const ID = 'column-editor';

/** Checklist of table columns; drag rows to reorder. Name is always on. */
export function ColumnEditor() {
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const toggle = useUi((s) => s.toggle);
  const columns = useResults((s) => s.columns);
  const setColumns = useResults((s) => s.setColumns);
  const [dragId, setDragId] = useState<ColumnId | null>(null);

  // Display order: visible columns in their order, then hidden ones.
  const ordered = [...columns, ...ALL_COLUMNS.map((c) => c.id).filter((id) => !columns.includes(id))];
  const meta = new Map(ALL_COLUMNS.map((c) => [c.id, c]));

  const onToggle = (id: ColumnId, on: boolean) => setColumns(on ? [...columns, id] : columns.filter((c) => c !== id));
  const onDrop = (target: ColumnId) => {
    if (!dragId || dragId === target || !columns.includes(dragId) || !columns.includes(target) || target === 'name') return;
    const next = columns.filter((c) => c !== dragId);
    next.splice(next.indexOf(target), 0, dragId);
    setColumns(next);
  };

  return (
    <>
      <button
        ref={setEl}
        data-tour="column-editor"
        onClick={() => toggle(ID)}
        className="inline-flex items-center gap-[6px] h-[30px] px-[13px] border border-primary rounded-btn text-primary text-[15px] font-semibold bg-white hover:bg-primary-light"
      >
        Edit table columns <ChevronDown size={15} />
      </button>
      <Popover id={ID} anchor={el} width={280} className="py-[6px]">
        <div className="px-[14px] pb-[6px] text-[12px] text-muted">Tick to show. Drag to reorder.</div>
        {ordered.map((id) => {
          const m = meta.get(id)!;
          const on = columns.includes(id);
          const locked = 'locked' in m && m.locked;
          return (
            <div
              key={id}
              draggable={on && !locked}
              onDragStart={() => setDragId(id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { onDrop(id); setDragId(null); }}
              className={`flex items-center gap-[6px] px-[10px] py-[5px] hover:bg-page ${dragId === id ? 'opacity-50' : ''}`}
            >
              <GripVertical size={14} className={on && !locked ? 'text-muted cursor-grab' : 'text-transparent'} />
              <Checkbox checked={on} disabled={!!locked} onChange={(v) => onToggle(id, v)} className="text-[14px] text-ink">
                {m.label}
              </Checkbox>
            </div>
          );
        })}
      </Popover>
    </>
  );
}
