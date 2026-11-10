import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { useUi } from '../../store/uiStore';
import { getCompanies } from '../../data/dataset';
import { go, profilePath } from '../../lib/nav';
import { Flag } from '../ui/Flag';
import { CountrySelect } from '../ui/CountrySelect';
import { countryName } from '../../data/countries/iso3166';

const ID = 'global-search';

export function GlobalSearch() {
  const [term, setTerm] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const open = useUi((s) => s.open);
  const close = useUi((s) => s.close);


  const matches = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (t.length < 2) return [];
    const out = [];
    for (const c of getCompanies()) {
      if (scope.length && !scope.includes(c.country)) continue;
      if (c.name.toLowerCase().includes(t)) out.push(c);
      if (out.length >= 8) break;
    }
    return out;
  }, [term, scope]);

  return (
    <div className="flex items-center gap-[6px] max-w-full">
    <CountrySelect mode="multi" value={scope} onChange={setScope} label="Search scope" size="md" compact tourKey="global-search-scope" />
    <div ref={setEl} className="relative w-[280px] max-w-full">
      <input
        value={term}
        onChange={(e) => { setTerm(e.target.value); e.target.value.trim().length >= 2 ? open(ID) : close(ID); }}
        onFocus={() => term.trim().length >= 2 && open(ID)}
        placeholder="Search companies"
        aria-label="Search companies"
        className="w-full h-[32px] border border-border rounded-btn pl-3 pr-9 text-[14px] text-ink placeholder:text-muted focus:outline-none focus:border-primary"
      />
      <Search size={16} className="absolute right-[10px] top-[8px] text-ink pointer-events-none" />
      <Popover id={ID} anchor={el} width={300} caret={false} className="py-1">
        {matches.length === 0 ? (
          <div className="px-3 py-2 text-[14px] text-muted">No companies match “{term}”</div>
        ) : (
          matches.map((c) => (
            <button
              key={c.id}
              onClick={() => { close(ID); setTerm(''); go(profilePath(c.id)); }}
              className="w-full text-left flex items-center gap-2 px-3 py-[6px] hover:bg-page"
            >
              <img src={c.logo} alt="" className="w-6 h-6 border border-border rounded-[2px]" />
              <span className="text-[14px] text-ink truncate">{c.name}</span>
              <span className="ml-auto text-[12px] text-muted shrink-0 flex items-center gap-[4px]"><Flag code={c.country} className="text-[13px]" />{c.country === 'GB' ? c.headOffice : countryName(c.country)}</span>
            </button>
          ))
        )}
      </Popover>
    </div>
    </div>
  );
}
