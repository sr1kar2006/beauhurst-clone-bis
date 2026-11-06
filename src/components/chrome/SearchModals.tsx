import { useEffect, useState } from 'react';
import { CheckCircle2, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useIsOpen, useUi } from '../../store/uiStore';
import { useSaved } from '../../store/savedStore';
import { useQuery, selectQuery } from '../../store/queryStore';
import { useResults } from '../../store/resultsStore';
import { useTour } from '../../store/tourStore';
import { formatDate } from '../../lib/format';
import { ENTITY_LABELS } from '../builder/entity';
import { BRAND_NAME } from '../../config';

function Header({ title, id }: { title: string; id: string }) {
  const close = useUi((s) => s.close);
  return (
    <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
      <h2 className="text-[18px] text-ink font-semibold">{title}</h2>
      <button onClick={() => close(id)} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
    </div>
  );
}

export function SaveSearchModal() {
  const id = 'save-search';
  const isOpen = useIsOpen(id);
  const close = useUi((s) => s.close);
  const saveSearch = useSaved((s) => s.saveSearch);
  const criteria = useQuery((s) => s.criteria);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (isOpen) { setName(''); setSaved(false); } }, [isOpen]);

  const save = () => {
    if (!name.trim()) return;
    saveSearch(name.trim(), selectQuery(useQuery.getState()));
    setSaved(true);
  };

  return (
    <Modal id={id} width={440} label="Save search">
      <Header title="Save search" id={id} />
      {saved ? (
        <div className="px-[22px] py-[24px] flex items-start gap-3">
          <CheckCircle2 size={22} className="text-bar-green shrink-0" />
          <p className="text-[15px] text-ink">Saved “{name}”. Open it again any time from <strong>Open search</strong>.</p>
        </div>
      ) : (
        <div className="px-[22px] py-[18px] space-y-[10px]">
          <p className="text-[14px] text-text">
            {criteria.length ? `This search has ${criteria.length} ${criteria.length === 1 ? 'criterion' : 'criteria'}.` : 'This search has no criteria yet. It will match every company.'}
          </p>
          <label className="block text-[14px] text-ink">
            Name
            <input
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="e.g. Active AI scaleups"
              className="mt-[4px] w-full h-[34px] border border-border rounded-btn px-3 text-[14px] text-ink focus:outline-none focus:border-primary"
            />
          </label>
        </div>
      )}
      <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
        {saved ? <Button onClick={() => close(id)}>Done</Button> : (
          <>
            <Button variant="outline" onClick={() => close(id)}>Cancel</Button>
            <Button onClick={save} disabled={!name.trim()}>Save</Button>
          </>
        )}
      </div>
    </Modal>
  );
}

export function OpenSearchModal() {
  const id = 'open-search';
  const close = useUi((s) => s.close);
  const { saved, remove } = useSaved();
  const loadQuery = useQuery((s) => s.loadQuery);
  const runSearch = useResults((s) => s.runSearch);

  return (
    <Modal id={id} width={560} label="Open search">
      <Header title="Open search" id={id} />
      <div className="max-h-[400px] overflow-y-auto nb-scroll">
        {saved.length === 0 ? (
          <p className="px-[22px] py-[28px] text-[15px] text-text">You haven&apos;t saved any searches yet. Build a search and click <strong>Save search</strong>.</p>
        ) : (
          <ul>
            {saved.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-[22px] py-[12px] border-b border-border last:border-b-0 hover:bg-page">
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => { loadQuery(s.query); runSearch(s.query); close(id); }}
                >
                  <div className="text-[15px] text-primary font-semibold truncate hover:underline">{s.name}</div>
                  <div className="text-[13px] text-muted">
                    Saved {formatDate(s.savedAt)} · {s.query.criteria.length} {s.query.criteria.length === 1 ? 'criterion' : 'criteria'} · {ENTITY_LABELS[s.query.entity].plural}
                  </div>
                </button>
                <button onClick={() => remove(s.id)} aria-label={`Delete ${s.name}`} className="p-[6px] text-text hover:text-[#D7263D] rounded-btn hover:bg-white">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

export function HelpModal() {
  const id = 'help-modal';
  const close = useUi((s) => s.close);
  const open = useUi((s) => s.open);
  const start = useTour((s) => s.start);
  return (
    <Modal id={id} width={440} label="Need help?">
      <Header title="Need help?" id={id} />
      <div className="px-[22px] py-[18px] space-y-[14px] text-[14px] text-text">
        <p>Our support team is available Monday to Friday, 9am to 5:30pm.</p>
        <ul className="space-y-[8px]">
          <li><button className="text-primary hover:underline" onClick={() => { close(id); start(0); }}>Take the “Build your first search” tour</button></li>
          <li><button className="text-primary hover:underline" onClick={() => { close(id); start(1); }}>Take the “Explore the results table” tour</button></li>
          <li><a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">Read the {BRAND_NAME} FAQ</a></li>
          <li><button className="text-primary hover:underline" onClick={() => { close(id); open('book-demo', 'modal'); }}>Book a demo with an expert</button></li>
        </ul>
      </div>
    </Modal>
  );
}
