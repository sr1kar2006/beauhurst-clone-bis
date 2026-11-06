import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb({ items = [{ label: 'Home', to: '/' }, { label: 'Search', to: '/' }, { label: 'Advanced Search' }] }: { items?: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-[6px] text-[14px] pt-[22px]">
      {items.map((it, i) => (
        <Fragment key={it.label + i}>
          {i > 0 && <ChevronRight size={12} className="text-muted" />}
          {it.to ? <Link to={it.to} className="text-primary hover:underline">{it.label}</Link> : <span className="text-text">{it.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
