import { BRAND_NAME, COPYRIGHT_FROM, COPYRIGHT_TO } from '../../config';

const LINKS = ['Cookies', 'Terms & Conditions', 'Privacy Policy', 'Jobs', 'About Us'];

export function Footer() {
  return (
    <footer data-app-footer className="bg-[#EDEDED] border-t border-border mt-16">
      <div className="max-w-content mx-auto px-5 py-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-text">
        {LINKS.map((l) => (
          <a key={l} href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary hover:underline">{l}</a>
        ))}
        <span className="text-muted">© Copyright {COPYRIGHT_FROM}-{COPYRIGHT_TO} {BRAND_NAME}.</span>
      </div>
    </footer>
  );
}
