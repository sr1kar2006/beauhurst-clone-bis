import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';

interface Opt<T extends string> { value: T; label: string }
interface Props<T extends string> {
  value: T;
  options: Opt<T>[];
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
  tourKey?: string;
}

/** Native select styled as the compact inline select used in sentences. */
export function CompactSelect<T extends string>({ value, options, onChange, className = '', ariaLabel, tourKey }: Props<T>) {
  return (
    <span className={`relative inline-flex items-center ${className}`} data-tour={tourKey}>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="appearance-none bg-white border border-border rounded-btn h-[28px] pl-2 pr-7 text-[14px] text-ink cursor-pointer hover:border-[#c8c8c8] focus:outline-none focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 text-text" />
    </span>
  );
}

/** Button that looks like a compact select; used for value pickers. */
export function SelectButton({ children, onClick, buttonRef, className = '', tourKey, ariaLabel }: {
  children: ReactNode; onClick: () => void; buttonRef?: (el: HTMLButtonElement | null) => void; className?: string; tourKey?: string; ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={onClick}
      data-tour={tourKey}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-between gap-2 bg-white border border-border rounded-btn h-[28px] pl-2 pr-2 text-[14px] text-ink max-w-[340px] hover:border-[#c8c8c8] focus:outline-none focus:border-primary ${className}`}
    >
      <span className="truncate">{children}</span>
      <ChevronDown size={14} className="shrink-0 text-text" />
    </button>
  );
}
