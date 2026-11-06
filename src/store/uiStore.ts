import { create } from 'zustand';

type Kind = 'popover' | 'modal';
interface Layer { id: string; kind: Kind }

interface UiState {
  layers: Layer[];
  open: (id: string, kind?: Kind) => void;
  close: (id: string) => void;
  toggle: (id: string, kind?: Kind) => void;
  closeTop: () => void;
  closeAllPopovers: () => void;
}

/**
 * One layer stack for every popover/modal. Opening a popover closes other popovers
 * (modals stay). Esc pops the top-most layer.
 */
export const useUi = create<UiState>((set, get) => ({
  layers: [],
  open: (id, kind = 'popover') =>
    set((s) => {
      const rest = s.layers.filter((l) => l.id !== id && (kind === 'modal' || l.kind === 'modal'));
      return { layers: [...rest, { id, kind }] };
    }),
  close: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
  toggle: (id, kind = 'popover') => (get().layers.some((l) => l.id === id) ? get().close(id) : get().open(id, kind)),
  closeTop: () => set((s) => ({ layers: s.layers.slice(0, -1) })),
  closeAllPopovers: () => set((s) => ({ layers: s.layers.filter((l) => l.kind === 'modal') })),
}));

export const useIsOpen = (id: string) => useUi((s) => s.layers.some((l) => l.id === id));

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && useUi.getState().layers.length) {
      useUi.getState().closeTop();
    }
  });
}
