import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useIsOpen, useUi } from '../../store/uiStore';
import { useCollections } from '../../store/collectionsStore';
import { useResults } from '../../store/resultsStore';
import { formatInt } from '../../lib/format';

const ID = 'collection-modal';

export function CollectionModal() {
  const isOpen = useIsOpen(ID);
  const close = useUi((s) => s.close);
  const target = useResults((s) => s.collectionTarget);
  const { collections, create, addTo } = useCollections();
  const [choice, setChoice] = useState<string>('new');
  const [name, setName] = useState('');
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setChoice(collections[0]?.id ?? 'new'); setName(''); setDone(null); }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (choice === 'new') {
      if (!name.trim()) return;
      const c = create(name.trim(), target);
      setDone(c.name);
    } else {
      addTo(choice, target);
      setDone(collections.find((c) => c.id === choice)?.name ?? '');
    }
  };

  return (
    <Modal id={ID} width={460} label="Add to collection">
      <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
        <h2 className="text-[18px] text-ink font-semibold">Add to collection</h2>
        <button onClick={() => close(ID)} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
      </div>
      {done ? (
        <div className="px-[22px] py-[26px] flex items-start gap-3">
          <CheckCircle2 className="text-bar-green shrink-0" size={22} />
          <p className="text-[15px] text-ink">
            Added {formatInt(target.length)} {target.length === 1 ? 'company' : 'companies'} to <strong>{done}</strong>.
          </p>
        </div>
      ) : (
        <div className="px-[22px] py-[18px] space-y-[10px]">
          <p className="text-[14px] text-text">
            Adding <strong className="text-ink">{formatInt(target.length)}</strong> {target.length === 1 ? 'company' : 'companies'} to:
          </p>
          <div className="max-h-[220px] overflow-y-auto nb-scroll space-y-[2px]">
            {collections.map((c) => (
              <label key={c.id} className="flex items-center gap-[10px] px-[8px] py-[6px] rounded-btn hover:bg-page cursor-pointer text-[15px] text-ink">
                <input type="radio" name="col" checked={choice === c.id} onChange={() => setChoice(c.id)} className="accent-primary" />
                {c.name}
                <span className="ml-auto text-[13px] text-muted">{formatInt(c.companyIds.length)} companies</span>
              </label>
            ))}
            <label className="flex items-center gap-[10px] px-[8px] py-[6px] rounded-btn hover:bg-page cursor-pointer text-[15px] text-ink">
              <input type="radio" name="col" checked={choice === 'new'} onChange={() => setChoice('new')} className="accent-primary" />
              Create a new collection
            </label>
          </div>
          {choice === 'new' && (
            <input
              data-autofocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              placeholder="Collection name"
              aria-label="Collection name"
              className="w-full h-[34px] border border-border rounded-btn px-3 text-[14px] text-ink focus:outline-none focus:border-primary"
            />
          )}
        </div>
      )}
      <div className="flex justify-end gap-[10px] px-[22px] py-[14px] border-t border-border">
        {done ? (
          <Button onClick={() => close(ID)}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => close(ID)}>Cancel</Button>
            <Button onClick={save} disabled={choice === 'new' && !name.trim()}>Save</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
