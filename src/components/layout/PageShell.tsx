import type { ReactNode } from 'react';
import { Breadcrumb } from '../chrome/Breadcrumb';
import { usePageTitle } from '../../lib/title';

interface Props {
  title: string;
  crumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/** Standard page frame for part 3 screens: breadcrumb, light 28px title, optional actions. */
export function PageShell({ title, crumbs, actions, intro, children, wide }: Props) {
  usePageTitle(title);
  return (
    <div className={`${wide ? 'max-w-[1440px]' : 'max-w-content'} mx-auto px-5 pb-[30px]`} data-page={title}>
      <Breadcrumb items={crumbs ?? [{ label: 'Home', to: '/' }, { label: title }]} />
      <div className="flex items-center gap-6 mt-[10px] mb-[18px]">
        <h1 className="text-[28px] font-light text-ink leading-tight">{title}</h1>
        <div className="flex-1" />
        {actions}
      </div>
      {intro && <div className="text-[15px] text-text mb-[18px] max-w-[900px]">{intro}</div>}
      {children}
    </div>
  );
}

export function Panel({ title, actions, children, className = '', bodyClass = 'p-[18px]' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={`bg-white border border-card-border rounded-card ${className}`}>
      {title && (
        <header className="flex items-center gap-3 px-[18px] h-[48px] border-b border-card-border">
          <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
          <div className="flex-1" />
          {actions}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export const btnPrimary = 'inline-flex items-center gap-[6px] h-[32px] px-[14px] rounded-btn bg-primary text-white text-[14px] font-semibold hover:bg-primary-hover disabled:opacity-50';
export const btnOutline = 'inline-flex items-center gap-[6px] h-[32px] px-[14px] rounded-btn border border-primary text-primary bg-white text-[14px] font-semibold hover:bg-primary-light disabled:opacity-50';
export const btnGhost = 'inline-flex items-center gap-[6px] h-[32px] px-[10px] rounded-btn text-primary text-[14px] font-semibold hover:bg-primary-light';
export const th = 'text-left text-[13px] font-semibold text-text px-[12px] py-[9px] border-b border-border bg-[#FAFAFA] whitespace-nowrap';
export const td = 'text-[14px] text-ink px-[12px] py-[9px] border-b border-card-border align-top';
