/** Beam logo mark: a light source casting a widening beam, i.e. shining a light on companies. */
export function BeamLogo({ size = 26, inverted = false, className = '' }: { size?: number; inverted?: boolean; className?: string }) {
  const bg = inverted ? '#FFFFFF' : '#282828';
  const fg = inverted ? 'currentColor' : '#FFFFFF';
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true" focusable="false" className={className}>
      <rect width="26" height="26" rx="3" fill={bg} />
      <path d="M8 13 L23 5.5 L23 20.5 Z" fill={fg} opacity="0.3" />
      <path d="M8 13 L23 9.5 L23 16.5 Z" fill={fg} opacity="0.85" />
      <circle cx="7.5" cy="13" r="3.2" fill={fg} />
    </svg>
  );
}
