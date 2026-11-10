import { PROTOTYPE_NOTICE } from '../../config';

/** Persistent, non-dismissible demo notice above the global header. */
export function PrototypeBanner() {
  return (
    <div data-prototype-banner role="note" className="h-[32px] bg-[#3A3A3A] text-white text-[13px] flex items-center justify-center px-4">
      {PROTOTYPE_NOTICE}
    </div>
  );
}
