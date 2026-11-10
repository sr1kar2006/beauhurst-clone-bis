import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { Popover } from '../components/ui/Popover';
import { useUi } from '../store/uiStore';
import type { ExportFormat, ExportSpec } from './types';
import { requestExport } from './requestExport';

let seq = 0;

/** "Export ▾" with Excel / PDF / CSV, all through the shared export service (bulk flow above the threshold). */
export function ExportMenu({ label = 'Export', build, filename, formats = ['xlsx', 'pdf', 'csv'], tourKey, className = '' }: {
  label?: string; build: () => ExportSpec | Promise<ExportSpec>; filename?: string; formats?: ExportFormat[]; tourKey?: string; className?: string;
}) {
  const [id] = useState(() => `export-menu-${seq++}`);
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const toggle = useUi((s) => s.toggle);
  const close = useUi((s) => s.close);
  const [busy, setBusy] = useState(false);
  const run = async (f: ExportFormat) => {
    close(id); setBusy(true);
    try { await requestExport(await build(), f, filename); } finally { setBusy(false); }
  };
  const names: Record<ExportFormat, string> = { xlsx: 'Excel (.xlsx)', pdf: 'PDF', csv: 'CSV' };
  return (
    <>
      <button ref={setEl} onClick={() => toggle(id)} data-tour={tourKey} data-export-menu={label} aria-haspopup="menu" disabled={busy}
        className={`inline-flex items-center gap-[6px] h-[30px] px-[12px] border border-primary rounded-btn text-[14px] font-semibold text-primary bg-white hover:bg-primary-light disabled:opacity-60 whitespace-nowrap ${className}`}>
        <Download size={15} />{busy ? 'Preparing…' : label}<ChevronDown size={14} />
      </button>
      <Popover id={id} anchor={el} placement="bottom-end" width={170} caret={false} className="py-[4px]">
        <div role="menu" aria-label={label}>
          {formats.map((f) => <button key={f} role="menuitem" onClick={() => run(f)} data-export-format={f} className="w-full text-left px-[14px] py-[6px] text-[14px] text-ink hover:bg-page">{names[f]}</button>)}
        </div>
      </Popover>
    </>
  );
}
