import { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useIsOpen, useUi } from '../../store/uiStore';
import { BRAND_NAME } from '../../config';

const field = 'w-full h-[34px] border border-border rounded-btn px-3 text-[14px] text-ink focus:outline-none focus:border-primary';

export function BookDemoModal() {
  const isOpen = useIsOpen('book-demo');
  const close = useUi((s) => s.close);
  const [sent, setSent] = useState(false);
  useEffect(() => { if (isOpen) setSent(false); }, [isOpen]);
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true); };

  return (
    <Modal id="book-demo" width={460} label="Book a demo">
      <div className="flex items-center justify-between px-[22px] py-[16px] border-b border-border">
        <h2 className="text-[18px] text-ink font-semibold">Book a demo</h2>
        <button onClick={() => close('book-demo')} aria-label="Close" className="text-text hover:text-ink"><X size={20} /></button>
      </div>
      {sent ? (
        <div className="px-[22px] py-[26px] flex gap-3 items-start">
          <CheckCircle2 size={22} className="text-bar-green shrink-0" />
          <p className="text-[15px] text-ink">Thanks! One of our experts will be in touch within one working day to arrange your personalised {BRAND_NAME} tour.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="px-[22px] py-[18px] space-y-[12px] text-[14px]">
          <label className="block"><span className="text-ink">Name</span><input data-autofocus required className={field} /></label>
          <label className="block"><span className="text-ink">Work email</span><input type="email" required className={field} /></label>
          <label className="block"><span className="text-ink">Company</span><input className={field} /></label>
          <label className="block"><span className="text-ink">What would you like to see?</span><textarea rows={3} className={`${field} h-auto py-2`} /></label>
          <div className="flex justify-end gap-[10px] pt-[4px]">
            <Button variant="outline" onClick={() => close('book-demo')}>Cancel</Button>
            <button type="submit" className="h-[30px] px-[15px] bg-primary text-white rounded-btn font-semibold text-[15px] hover:bg-primary-hover">Request demo</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
