import { useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useUi } from '../../store/uiStore';
import { go } from '../../lib/nav';

const SHORTCUTS: [string, string][] = [
  ['?', 'Show this list of shortcuts'], ['/', 'Go to Advanced search'], ['g then h', 'Help centre'], ['g then n', 'News'], ['g then r', 'Reports'],
  ['Tab / Shift+Tab', 'Move between controls'], ['Enter / Space', 'Activate a button or option'], ['Arrow keys', 'Move within lists, menus and the country selector'], ['Esc', 'Close the top-most pop-up or dialog'],
];

/** Keyboard shortcuts overlay, opened with "?" anywhere outside a text field. */
export function ShortcutsOverlay() {
  const open = useUi((s) => s.open);
  useEffect(() => {
    let g = false;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '?') { e.preventDefault(); open('shortcuts', 'modal'); return; }
      if (g) { g = false; const to = { h: '/help', n: '/news', r: '/reports' }[e.key]; if (to) go(to); return; }
      if (e.key === 'g') { g = true; setTimeout(() => (g = false), 1200); }
      if (e.key === '/') { e.preventDefault(); go('/'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <Modal id="shortcuts" width={480} label="Keyboard shortcuts">
      <div className="px-[22px] py-[16px] border-b border-border"><h2 className="text-[18px] text-ink font-semibold">Keyboard shortcuts</h2></div>
      <dl className="px-[22px] py-[14px] text-[14px]" data-shortcuts>
        {SHORTCUTS.map(([k, v]) => <div key={k} className="flex py-[6px] border-b border-card-border last:border-0"><dt className="w-[150px]"><kbd className="px-[6px] py-[1px] border border-border rounded-[3px] bg-page font-mono text-[12px]">{k}</kbd></dt><dd className="text-text">{v}</dd></div>)}
      </dl>
    </Modal>
  );
}
