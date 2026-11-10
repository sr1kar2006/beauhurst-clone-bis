import type { ReactNode } from 'react';
import type { TenderValue } from '../../config/tender';

/** Small "Sample" tag shown next to any placeholder figure (honesty rule). */
export function SampleTag({ note, className = '' }: { note?: string; className?: string }) {
  return (
    <span
      title={note ?? 'Sample value for the client demo, not a commitment.'}
      data-sample-tag
      className={`inline-flex items-center align-middle h-[16px] px-[5px] ml-[6px] rounded-[3px] bg-[#FFF2CC] text-[#7A5B00] border border-[#EBD38A] text-[10px] font-bold uppercase tracking-[0.04em] leading-none ${className}`}
    >
      Sample
    </span>
  );
}

/** Render a tender value with the Sample tag when it is not confirmed. */
export function TV<T>({ v, render }: { v: TenderValue<T>; render?: (value: T) => ReactNode }) {
  return (
    <>
      {render ? render(v.value) : String(v.value)}
      {v.status === 'sample' && <SampleTag note={v.note} />}
    </>
  );
}
