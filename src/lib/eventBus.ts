type Handler = (payload?: unknown) => void;
const handlers = new Set<(name: string, payload?: unknown) => void>();

/** Tiny global bus. Components emit UI events; the tour engine listens. */
export const bus = {
  emit(name: string, payload?: unknown) {
    handlers.forEach((h) => {
      try { h(name, payload); } catch (e) { console.warn('[bus]', e); }
    });
  },
  on(fn: (name: string, payload?: unknown) => void) {
    handlers.add(fn);
    return () => { handlers.delete(fn); };
  },
};
export type { Handler };
