import { useEffect, useState } from 'react';
import { AlertTriangle, Check, FileText, Link2, ListPlus, Sheet, X } from 'lucide-react';
import type { Company } from '../../data/types';
import type { CompanyProfile } from '../../data/profile/types';
import { Popover } from '../../components/ui/Popover';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { useIsOpen, useUi } from '../../store/uiStore';
import { useCollections } from '../../store/collectionsStore';
import { downloadBlob, toCsv } from '../../lib/download';
import { formatDate, formatInt, formatMoney, joinAnd } from '../../lib/format';
import { industryLabels } from '../../components/results/cells';
import { SECTIONS } from './sections';
import { useToast } from './ui';

const COLL_ID = 'profile-collections';

export function CompanyHeader({ c, p, onPrint }: { c: Company; p: CompanyProfile; onPrint: () => void }) {
  const open = useUi((s) => s.open);
  const exportCsv = () => {
    const last = p.financials[p.financials.length - 1]?.values ?? {};
    const rows: (string | number)[][] = [
      ['Name', c.name], ['Registered name', p.registeredName], ['Companies House ID', c.companiesHouseId], ['Status', c.chStatus],
      ['Incorporation date', formatDate(p.incorporationDate)], ['Stage of evolution', c.stage], ['Head office', p.addresses.headOffice.join(', ')],
      ['Website', c.website ?? ''], ['Industries', joinAnd(industryLabels(c))], ['Description', c.description],
      ['Total raised (£)', c.fundraisingTotal], ['Turnover (£)', (last.turnover as number) ?? ''], ['Employees', c.employees ?? ''],
      ['Directors', p.people.directors.map((d) => d.name).join('; ')],
    ];
    downloadBlob(toCsv(['Field', 'Value'], rows), `${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-profile.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="sticky top-0 z-30 bg-surface border-b border-border h-[56px] no-print-border" data-company-header>
      <div className="max-w-[1440px] mx-auto h-full px-[20px] flex items-center gap-[12px]">
        <img src={c.logo} alt="" className="w-[36px] h-[36px] rounded-[3px] border border-border" />
        <h1 className="text-[22px] font-medium text-ink truncate">{c.name}</h1>
        <div className="ml-auto flex items-center gap-[10px] no-print">
          <CollectionsButton companyId={c.id} />
          <div className="inline-flex border border-primary rounded-btn overflow-hidden divide-x divide-primary">
            <button onClick={onPrint} className="inline-flex items-center gap-[6px] h-[30px] px-[12px] text-[15px] font-semibold text-primary bg-white hover:bg-primary-light"><FileText size={15} />PDF</button>
            <button onClick={exportCsv} className="inline-flex items-center gap-[6px] h-[30px] px-[12px] text-[15px] font-semibold text-primary bg-white hover:bg-primary-light"><Sheet size={15} />CSV</button>
          </div>
          <Button onClick={() => open('share-modal', 'modal')}><Link2 size={15} />Share</Button>
          <button onClick={() => open('report-modal', 'modal')} aria-label="Report an issue" title="Report an issue" className="w-[30px] h-[30px] flex items-center justify-center border border-primary rounded-btn text-primary hover:bg-primary-light">
            <AlertTriangle size={15} />
          </button>
        </div>
      </div>
      <ShareModal />
      <ReportModal companyName={c.name} />
    </div>
  );
}

function CollectionsButton({ companyId }: { companyId: string }) {
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const toggle = useUi((s) => s.toggle);
  const { collections, addTo, removeFrom, create } = useCollections();
  const [name, setName] = useState('');
  const inCount = collections.filter((c) => c.companyIds.includes(companyId)).length;
  return (
    <>
      <button
        ref={setEl}
        data-tour="profile-collections"
        onClick={() => toggle(COLL_ID)}
        className={`inline-flex items-center gap-[6px] h-[30px] px-[12px] border border-primary rounded-btn text-[15px] font-semibold text-primary ${inCount ? 'bg-collections-btn' : 'bg-white'} hover:brightness-95`}
      >
        <ListPlus size={16} />
        {inCount ? `In ${inCount} collection${inCount === 1 ? '' : 's'}` : 'Add to collection'}
      </button>
      <Popover id={COLL_ID} anchor={el} placement="bottom-end" width={330} className="py-[8px]">
        <div className="px-[14px] pb-[6px] text-[13px] text-muted">Tick to add, untick to remove</div>
        <div className="max-h-[300px] overflow-y-auto nb-scroll">
          {collections.map((col) => (
            <div key={col.id} className="px-[14px] py-[5px] hover:bg-page">
              <Checkbox checked={col.companyIds.includes(companyId)} onChange={(on) => (on ? addTo(col.id, [companyId]) : removeFrom(col.id, [companyId]))} className="text-[14px] text-ink w-full">
                <span className="truncate">{col.name}</span>
                <span className="text-muted ml-[6px] text-[12px]">{col.owner}</span>
              </Checkbox>
            </div>
          ))}
        </div>
        <form
          className="flex gap-[6px] px-[14px] pt-[8px] mt-[6px] border-t border-border"
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) { create(name.trim(), [companyId]); setName(''); } }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Create new collection" aria-label="New collection name" className="flex-1 h-[30px] border border-border rounded-btn px-2 text-[14px] focus:outline-none focus:border-primary" />
          <Button type="submit" size="sm" disabled={!name.trim()}>Create</Button>
        </form>
      </Popover>
    </>
  );
}

function ShareModal() {
  const isOpen = useIsOpen('share-modal');
  const close = useUi((s) => s.close);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  useEffect(() => { if (!isOpen) setCopied(false); }, [isOpen]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); } catch { /* blocked clipboard: still confirm */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Modal id="share-modal" width={520} label="Share this profile">
      <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
        <h2 className="text-[18px] text-ink font-semibold">Share this profile</h2>
        <button onClick={() => close('share-modal')} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
      </div>
      <div className="px-[22px] py-[18px] space-y-[8px]">
        <p className="text-[14px] text-text">Anyone in your team with access can open this link.</p>
        <div className="flex gap-[8px]">
          <input readOnly value={url} aria-label="Profile link" onFocus={(e) => e.target.select()} className="flex-1 h-[34px] border border-border rounded-btn px-3 text-[14px] text-ink bg-page" />
          <Button data-autofocus onClick={copy}>{copied ? <><Check size={15} />Copied</> : 'Copy'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ReportModal({ companyName }: { companyName: string }) {
  const close = useUi((s) => s.close);
  const show = useToast((s) => s.show);
  const [text, setText] = useState('');
  const [section, setSection] = useState('summary');
  return (
    <Modal id="report-modal" width={500} label="Report an issue">
      <form onSubmit={(e) => { e.preventDefault(); close('report-modal'); setText(''); show(`Thanks: we'll review the issue you reported on ${companyName}.`); }}>
        <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
          <h2 className="text-[18px] text-ink font-semibold">Report an issue</h2>
          <button type="button" onClick={() => close('report-modal')} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
        </div>
        <div className="px-[22px] py-[18px] space-y-[12px] text-[14px]">
          <label className="block text-ink">Which section?
            <select value={section} onChange={(e) => setSection(e.target.value)} className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-2 bg-white">
              {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="block text-ink">What's wrong?
            <textarea data-autofocus required value={text} onChange={(e) => setText(e.target.value)} rows={4} className="mt-[4px] block w-full border border-border rounded-btn px-3 py-2 focus:outline-none focus:border-primary" placeholder="For example: the head office address has changed." />
          </label>
        </div>
        <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
          <Button variant="outline" onClick={() => close('report-modal')}>Cancel</Button>
          <button type="submit" className="h-[30px] px-[15px] bg-primary text-white rounded-btn font-semibold text-[15px] hover:bg-primary-hover">Submit</button>
        </div>
      </form>
    </Modal>
  );
}

export const fmt = { money: formatMoney, int: formatInt };
