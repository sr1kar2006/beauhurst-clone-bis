import { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useIsOpen, useUi } from '../../store/uiStore';

interface Props {
  id: string;
  children: ReactNode;
  width?: number;
  className?: string;
  tourKey?: string;
  dim?: boolean;
  label?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';

/** Centred modal with dimmed backdrop, focus trap, Esc via layer stack. */
export function Modal({ id, children, width = 480, className = '', tourKey, dim = true, label }: Props) {
  const isOpen = useIsOpen(id);
  const close = useUi((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const first = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !ref.current) return;
      const els = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <div
      data-layer-ignore
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 ${dim ? 'bg-black/45' : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(id); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        data-tour={tourKey}
        style={{ width, maxWidth: 'calc(100vw - 32px)' }}
        className={`bg-surface rounded-card shadow-[0_8px_32px_rgba(0,0,0,0.25)] animate-fadein ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
