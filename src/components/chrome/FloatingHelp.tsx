import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { useUi } from '../../store/uiStore';
import { useTour } from '../../store/tourStore';
import { TOURS } from '../tour/steps';

const MENU = 'tours-menu';

export function FloatingHelp() {
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const toggle = useUi((s) => s.toggle);
  const close = useUi((s) => s.close);
  const open = useUi((s) => s.open);
  const start = useTour((s) => s.start);
  const lastTour = useTour((s) => s.lastTourIndex);

  return (
    <div className="fixed right-[22px] bottom-[18px] z-50 flex flex-col items-end gap-[10px]" data-layer-ignore>
      <button
        ref={setEl}
        onClick={() => toggle(MENU)}
        className="relative bg-tour-yellow text-ink font-semibold text-[14px] h-[36px] px-[16px] rounded-pill shadow-[0_2px_8px_rgba(0,0,0,0.18)] hover:brightness-95"
      >
        Platform tours
        <span className="absolute -top-[9px] -right-[9px] bg-white text-ink text-[11px] font-semibold rounded-full w-[26px] h-[26px] flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
          {lastTour + 1}/{TOURS.length}
        </span>
      </button>
      <Popover id={MENU} anchor={el} placement="top-end" width={250} className="py-1">
        <div className="px-4 pt-2 pb-1 text-[12px] uppercase tracking-wide text-muted">Platform tours</div>
        {TOURS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => { close(MENU); start(i); }}
            className="w-full text-left px-4 py-2 hover:bg-page"
          >
            <div className="text-[14px] text-ink font-medium">{i + 1}. {t.title}</div>
            <div className="text-[12px] text-muted">{t.subtitle}</div>
          </button>
        ))}
      </Popover>
      <button
        onClick={() => open('help-modal', 'modal')}
        className="flex items-center gap-2 bg-primary text-white font-semibold text-[15px] h-[42px] px-[18px] rounded-[21px] shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:bg-primary-hover"
      >
        <MessageCircle size={18} />
        Need help?
      </button>
    </div>
  );
}
