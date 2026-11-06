/** Small inline flags (emoji flags don't render on Windows). */
export function FlagGB({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={`inline-block w-[18px] h-[12px] shrink-0 ${className}`} aria-label="United Kingdom">
      <clipPath id="gbs"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="gbt"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#gbs)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#gbt)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function FlagDE({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 5 3" className={`inline-block w-[18px] h-[12px] shrink-0 ${className}`} aria-label="Germany">
      <rect width="5" height="3" y="0" fill="#000" />
      <rect width="5" height="2" y="1" fill="#D00" />
      <rect width="5" height="1" y="2" fill="#FFCE00" />
    </svg>
  );
}

export function Highlight({ text, term }: { text: string; term: string }) {
  const t = term.trim();
  if (!t) return <>{text}</>;
  const i = text.toLowerCase().indexOf(t.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="nb-hl">{text.slice(i, i + t.length)}</mark>
      {text.slice(i + t.length)}
    </>
  );
}
