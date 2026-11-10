import { countryByCode } from '../../data/countries/iso3166';

/** Emoji flag with an accessible country name. */
export function Flag({ code, className = '' }: { code: string; className?: string }) {
  const c = countryByCode(code);
  return <span role="img" aria-label={c.name} title={c.name} data-flag={code} className={`inline-block leading-none text-[15px] ${className}`}>{c.flag}</span>;
}
