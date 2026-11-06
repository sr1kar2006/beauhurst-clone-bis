import { create } from 'zustand';
import { load, save } from '../lib/storage';

const SEEN_KEY = 'nb.tourSeen';
const LAST_KEY = 'nb.lastTour';

interface State {
  active: boolean;
  tourIndex: number;
  stepIndex: number;
  lastTourIndex: number;
  start: (tourIndex: number) => void;
  next: () => void;
  goTo: (i: number) => void;
  end: () => void;
}

export const hasSeenTour = () => load<boolean>(SEEN_KEY, false);

export const useTour = create<State>((set) => ({
  active: false,
  tourIndex: 0,
  stepIndex: 0,
  lastTourIndex: load<number>(LAST_KEY, 0),
  start: (tourIndex) => {
    save(SEEN_KEY, true);
    save(LAST_KEY, tourIndex);
    set({ active: true, tourIndex, stepIndex: 0, lastTourIndex: tourIndex });
  },
  next: () => set((s) => ({ stepIndex: s.stepIndex + 1 })),
  goTo: (stepIndex) => set({ stepIndex }),
  end: () => set({ active: false, stepIndex: 0 }),
}));
