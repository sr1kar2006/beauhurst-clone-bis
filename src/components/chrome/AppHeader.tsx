import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCompany } from '../../data/dataset';
import { LUMEN_ID, profilePath, recentProfiles } from '../../lib/nav';
import { ChevronRight, Grip } from 'lucide-react';
import { BRAND_NAME, USER_NAME } from '../../config';
import { Popover } from '../ui/Popover';
import { useIsOpen, useUi } from '../../store/uiStore';
import { GlobalSearch } from './GlobalSearch';

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2 select-none" aria-label={BRAND_NAME}>
      <span className="w-[26px] h-[26px] bg-ink text-white flex items-center justify-center font-serif text-[16px] font-bold leading-none rounded-[2px]">
        {BRAND_NAME[0]}
      </span>
      <span className="font-serif text-[22px] text-ink leading-none tracking-[-0.01em]">{BRAND_NAME}</span>
    </span>
  );
}

interface NavLinkItem { label: string; to?: string; hint?: string; logo?: string }

const NAV: { label: string; items: NavLinkItem[] }[] = [
  { label: `My ${BRAND_NAME}`, items: ['Dashboard', 'My collections', 'Saved searches', 'Alerts', 'Account settings'].map((label) => ({ label })) },
  { label: 'Search', items: [{ label: 'Advanced search', to: '/' }, ...['Company search', 'Fundraising search', 'Investor search', 'People search'].map((label) => ({ label }))] },
  { label: 'News & Reports', items: ['Latest news', 'Research reports', 'Webinars', 'Data methodology'].map((label) => ({ label })) },
];

function NavItem({ label, items, tourKey, width = 210, footer }: { label: string; items: NavLinkItem[]; tourKey?: string; width?: number; footer?: string }) {
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const toggle = useUi((s) => s.toggle);
  const close = useUi((s) => s.close);
  const id = `nav:${label}`;
  return (
    <>
      <button ref={setEl} data-tour={tourKey} onClick={() => toggle(id)} className="flex items-center gap-[3px] text-[15px] text-ink hover:text-primary h-full">
        {label}
        <ChevronRight size={13} className="text-muted mt-[1px]" />
      </button>
      <Popover id={id} anchor={el} width={width} caret={false} className="py-1">
        {items.map((it) =>
          it.to ? (
            <Link key={it.label + it.to} to={it.to} onClick={() => close(id)} className="flex items-center gap-[8px] px-4 py-2 text-[14px] text-ink hover:bg-page">
              {it.logo && <img src={it.logo} alt="" className="w-[20px] h-[20px] border border-border rounded-[2px]" />}
              <span className="truncate">{it.label}</span>
              {it.hint && <span className="ml-auto text-[12px] text-muted shrink-0">{it.hint}</span>}
            </Link>
          ) : (
            <a key={it.label} href="#" onClick={(e) => { e.preventDefault(); close(id); }} className="block px-4 py-2 text-[14px] text-ink hover:bg-page">
              {it.label}
            </a>
          ),
        )}
        {footer && <div className="px-4 pt-2 pb-1 mt-1 border-t border-border text-[12px] text-muted">{footer}</div>}
      </Popover>
    </>
  );
}

/** "Company profile" menu: the demo company plus recently viewed profiles. */
function CompanyProfileNav() {
  // re-read recent profiles each time the menu opens
  const isOpen = useIsOpen('nav:Company profile');
  const items = useMemo<NavLinkItem[]>(() => {
    const demo = getCompany(LUMEN_ID);
    const recent = recentProfiles().filter((id) => id !== LUMEN_ID).map(getCompany).filter(Boolean).slice(0, 5);
    return [
      { label: demo?.name ?? 'Lumen Bank', to: profilePath(LUMEN_ID), hint: 'Demo', logo: demo?.logo },
      ...recent.map((c) => ({ label: c!.name, to: profilePath(c!.id), hint: 'Recent', logo: c!.logo })),
    ];
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  return <NavItem label="Company profile" items={items} tourKey="nav-company-profile" width={280} footer="Tip: click any company name in your search results to open its profile." />;
}

export function AppHeader() {
  // On profile pages the global header scrolls away and the company header becomes sticky instead.
  const onProfile = useLocation().pathname.startsWith('/companies/');
  return (
    <header data-app-header className={`bg-surface border-b border-border h-[52px] z-40 ${onProfile ? 'relative' : 'sticky top-0'}`}>
      <div className="h-full px-[20px] flex items-center">
        <Link to="/" className="mr-[34px]" aria-label={`${BRAND_NAME} home`}>
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-[26px] h-full">
          {NAV.map((n) => <NavItem key={n.label} {...n} />)}
          <CompanyProfileNav />
        </nav>
        <div className="flex-1 flex justify-center px-6">
          <GlobalSearch />
        </div>
        <div className="flex items-center gap-[24px] text-[15px] text-ink">
          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary">Help</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary">What&apos;s New</a>
          <a href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-[3px] hover:text-primary">
            {USER_NAME}
            <ChevronRight size={13} className="text-muted" />
          </a>
          <button aria-label="Apps" className="w-[34px] h-[34px] bg-[#EFEFEF] rounded-btn flex items-center justify-center text-ink hover:bg-[#e4e4e4]">
            <Grip size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
