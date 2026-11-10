import { FormEvent, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Download, PlayCircle, Search } from 'lucide-react';
import { PageShell, Panel, btnOutline, btnPrimary, th, td } from '../../components/layout/PageShell';
import { TV, SampleTag } from '../../components/ui/Sample';
import { TENDER } from '../../config';
import { ARTICLES, VIDEOS } from './helpContent';
import { useTour } from '../../store/tourStore';
import { exportSpec } from '../../export/service';
import changelog from '../../../CHANGELOG.md?raw';

// ------------------------------------------------------------------ help centre
export function HelpPage() {
  const [q, setQ] = useState('');
  const start = useTour((s) => s.start);
  const shown = useMemo(() => ARTICLES.filter((a) => !q || `${a.title} ${a.summary} ${a.body.join(' ')}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const guide = () => exportSpec({ title: 'User guide', subtitle: 'Training material generated from the help centre', toc: true, sheets: [], text: ARTICLES.map((a) => ({ heading: a.title, body: a.body.join('\n\n') })), sources: ['in-house'] }, 'pdf', 'user-guide');
  return (
    <PageShell title="Help centre" wide actions={<Link to="/support" className={btnOutline}>Contact support</Link>}>
      <div className="relative max-w-[560px] mb-[16px]">
        <Search size={16} className="absolute left-[10px] top-[10px] text-text" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" aria-label="Search help articles" className="w-full h-[36px] border border-border rounded-btn pl-[32px] pr-[10px] text-[15px]" data-help-search />
      </div>
      <div className="grid grid-cols-[1fr_340px] gap-[18px] items-start">
        <ul className="grid grid-cols-2 gap-[12px]" data-help-articles>
          {shown.map((a) => (
            <li key={a.id} className="bg-white border border-card-border rounded-card p-[16px]">
              <div className="text-[12px] text-muted uppercase tracking-wide">{a.category}</div>
              <h2 className="text-[17px] font-semibold text-ink mt-[2px]"><Link to={`/help/${a.id}`} className="hover:text-primary hover:underline">{a.title}</Link></h2>
              <p className="text-[14px] text-text mt-[4px]">{a.summary}</p>
            </li>
          ))}
          {!shown.length && <li className="text-text">No articles match “{q}”.</li>}
        </ul>
        <div className="space-y-[16px]">
          <Panel title="Training materials">
            <button className={`${btnPrimary} w-full justify-center`} onClick={guide} data-user-guide><Download size={15} />Download the PDF user guide</button>
            <ul className="mt-[12px] space-y-[8px]">
              {VIDEOS.map((v) => (
                <li key={v.id}>
                  <details className="border border-card-border rounded-card">
                    <summary className="px-[10px] py-[8px] cursor-pointer text-[14px] text-ink inline-flex items-center gap-[6px]"><PlayCircle size={16} className="text-primary" />{v.title}</summary>
                    <div className="px-[10px] pb-[10px] text-[13px] text-text"><div className="h-[120px] bg-[#EEEDF6] rounded-[3px] flex items-center justify-center text-muted mb-[6px]">Video placeholder</div><strong>Transcript:</strong> {v.transcript}</div>
                  </details>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Guided tours">
            <ul className="space-y-[6px] text-[14px]">
              <li><Link to="/" onClick={() => setTimeout(() => start(0), 300)} className="text-primary hover:underline">Build your first search</Link></li>
              <li><Link to="/companies/lumen-bank" onClick={() => setTimeout(() => start(1), 300)} className="text-primary hover:underline">Explore a company profile</Link></li>
              <li><Link to="/" onClick={() => setTimeout(() => start(2), 300)} className="text-primary hover:underline">Your results table</Link></li>
            </ul>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

export function HelpArticlePage() {
  const { article = '' } = useParams();
  const a = ARTICLES.find((x) => x.id === article);
  const start = useTour((s) => s.start);
  if (!a) return <PageShell title="Article not found"><Link to="/help" className="text-primary underline">Back to the help centre</Link></PageShell>;
  return (
    <PageShell title={a.title} crumbs={[{ label: 'Home', to: '/' }, { label: 'Help centre', to: '/help' }, { label: a.title }]}>
      <article className="bg-white border border-card-border rounded-card p-[24px] max-w-[820px] text-[15px] text-text space-y-[12px]">
        {a.body.map((p) => <p key={p}>{p}</p>)}
        <div className="flex gap-[10px] pt-[6px]">
          {a.link && <Link to={a.link.to} className={btnPrimary}><BookOpen size={15} />{a.link.label}</Link>}
          {a.tour != null && <Link to={a.tour === 1 ? '/companies/lumen-bank' : '/'} onClick={() => setTimeout(() => start(a.tour!), 300)} className={btnOutline}>Take the guided tour</Link>}
        </div>
      </article>
    </PageShell>
  );
}

// ------------------------------------------------------------------ support
export function SupportPage() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true); };
  return (
    <PageShell title="Support" intro={<>Support arrangements for the service. All values are placeholders until confirmed by the bid team.</>}>
      <div className="grid grid-cols-[1.4fr_1fr] gap-[18px] items-start">
        <Panel title={<>Severity levels and targets<SampleTag note={TENDER.slas.note} /></>} bodyClass="">
          <table className="w-full border-collapse" data-sla-table>
            <thead><tr>{['Level', 'Example', 'Target response', 'Target resolution'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
            <tbody>{TENDER.slas.value.map((s) => <tr key={s.level}><td className={`${td} font-semibold whitespace-nowrap`}>{s.level} {s.name}</td><td className={td}>{s.example}</td><td className={td}>{s.response}</td><td className={td}>{s.resolution}</td></tr>)}</tbody>
          </table>
          <dl className="px-[18px] py-[14px] text-[14px] space-y-[6px]">
            <div><dt className="inline font-semibold text-ink">Support hours: </dt><dd className="inline"><TV v={TENDER.supportHours} /></dd></div>
            <div><dt className="inline font-semibold text-ink">Channels: </dt><dd className="inline"><TV v={TENDER.supportChannels} render={(c) => c.join(' · ')} /></dd></div>
            <div><dt className="inline font-semibold text-ink">Availability: </dt><dd className="inline"><TV v={TENDER.availability} /></dd></div>
          </dl>
        </Panel>
        <Panel title="Contact us">
          {sent ? <p role="status" className="text-[14px] text-[#1E6B34]" data-support-sent>Thanks. Your request has a reference and you will get a reply within the target response time for its severity (sample).</p> : (
            <form onSubmit={submit} className="space-y-[10px] text-[14px]">
              <label className="block text-ink">Severity<select className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-2 bg-white">{TENDER.slas.value.map((s) => <option key={s.level}>{s.level} {s.name}</option>)}</select></label>
              <label className="block text-ink">Subject<input required className="mt-[4px] block w-full h-[34px] border border-border rounded-btn px-3" /></label>
              <label className="block text-ink">Describe the problem<textarea required rows={5} className="mt-[4px] block w-full border border-border rounded-btn px-3 py-2" /></label>
              <button type="submit" className={btnPrimary}>Send</button>
            </form>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

// ------------------------------------------------------------------ accessibility statement (draft)
export function AccessibilityPage() {
  return (
    <PageShell title="Accessibility statement" intro={<strong className="text-[#9B1C1C]">DRAFT for the bid team: TODO(bid team) review before publication.</strong>}>
      <article className="bg-white border border-card-border rounded-card p-[24px] max-w-[880px] text-[15px] text-text space-y-[14px]" data-a11y-statement>
        <section><h2 className="text-[18px] font-semibold text-ink mb-[4px]">Conformance status</h2><p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at level AA. The prototype is tested automatically with axe on every page (no serious or critical issues) and with keyboard-only journeys. It is partially conformant until a full manual audit is completed.</p></section>
        <section><h2 className="text-[18px] font-semibold text-ink mb-[4px]">What we have done</h2><ul className="list-disc pl-[20px] space-y-[3px]"><li>Every feature can be used with a keyboard, with visible focus and a Skip to content link.</li><li>Pop-ups and dialogs trap and return focus; Esc closes the top-most layer.</li><li>Charts have titles, descriptions and a View as table option.</li><li>Animations are switched off when your device asks for reduced motion.</li><li>Colours meet AA contrast; links in text are underlined.</li></ul></section>
        <section><h2 className="text-[18px] font-semibold text-ink mb-[4px]">Known issues</h2><ul className="list-disc pl-[20px] space-y-[3px]"><li>The map tab relies on a third-party map; company data on the map is also available in the results table and statistics.</li><li>The network graph is best used through its View as list alternative with a screen reader.</li><li>Exported PDF files are not yet tagged for screen readers. TODO(bid team): confirm the remediation plan.</li></ul></section>
        <section><h2 className="text-[18px] font-semibold text-ink mb-[4px]">How we test</h2><p>Automated axe checks in continuous integration, keyboard-only end-to-end journeys (build a search, open a profile, export, compare), and Lighthouse accessibility budgets. TODO(bid team): add assistive technology testing (NVDA, JAWS, VoiceOver) and an external audit date.</p></section>
        <section><h2 className="text-[18px] font-semibold text-ink mb-[4px]">Contact and feedback</h2><p>Tell us about any problem through the <Link to="/support" className="text-primary underline">Support</Link> page. Target response: <TV v={TENDER.slas} render={(s) => s[2].response} />.</p></section>
        <p className="text-[13px] text-muted">Statement prepared {new Date().toLocaleDateString('en-GB')}. Prototype for client demo.</p>
      </article>
    </PageShell>
  );
}

// ------------------------------------------------------------------ M14: what's new, status, governance
export function WhatsNewPage() {
  const blocks = changelog.split(/\n(?=## )/).filter((b) => b.startsWith('## '));
  return (
    <PageShell title="What's new" intro="Release notes, generated from CHANGELOG.md.">
      <div className="space-y-[14px] max-w-[880px]" data-release-notes>
        {blocks.map((b) => {
          const [head, ...rest] = b.split('\n');
          return (
            <Panel key={head} title={head.replace(/^##\s*/, '')}>
              <ul className="list-disc pl-[20px] text-[14px] text-text space-y-[3px]">{rest.filter((l) => l.startsWith('- ')).map((l) => <li key={l}>{l.slice(2)}</li>)}</ul>
            </Panel>
          );
        })}
      </div>
    </PageShell>
  );
}

const SERVICES = ['Search and profiles', 'Exports and bulk downloads', 'Monitoring and alerts', 'Data ingestion: UK and Ireland registries', 'Data ingestion: international partners', 'Sign-in'];
export function StatusPage() {
  return (
    <PageShell title="Service status" intro={<>This is a stub: in production it would read from the monitoring platform. <SampleTag /></>}>
      <Panel bodyClass="">
        <table className="w-full border-collapse" data-status-table>
          <thead><tr>{['Service', 'Status', 'Last 90 days'].map((h) => <th key={h} className={th}>{h}</th>)}</tr></thead>
          <tbody>{SERVICES.map((s, i) => <tr key={s}><td className={`${td} font-semibold`}>{s}</td><td className={td}><span className="px-[8px] py-[2px] rounded-full text-[12px] font-semibold bg-[#DCF3E1] text-[#1E6B34]">Operational</span></td><td className={td}>{(99.98 - i * 0.03).toFixed(2)}% uptime (sample)</td></tr>)}</tbody>
        </table>
      </Panel>
      <p className="text-[13px] text-text mt-[10px]">Planned maintenance: <TV v={TENDER.maintenanceWindow} /></p>
    </PageShell>
  );
}

export function GovernancePage() {
  const rows: [string, React.ReactNode][] = [
    ['Support model', <TV key="s" v={TENDER.supportHours} />],
    ['Availability target', <TV key="a" v={TENDER.availability} />],
    ['Release cadence and change management', <TV key="r" v={TENDER.releaseCadence} />],
    ['Planned maintenance', <TV key="m" v={TENDER.maintenanceWindow} />],
    ['Hosting', <TV key="h" v={TENDER.hosting} />],
    ['Business continuity (RPO / RTO)', <TV key="b" v={TENDER.rpoRto} />],
    ['Data retention', <TV key="d" v={TENDER.dataRetention} />],
    ['Data corrections', <TV key="c" v={TENDER.correctionTurnaround} />],
  ];
  return (
    <PageShell title="Service & governance" intro="How the service would be supported, changed and protected. Every value is a placeholder until the bid team confirms it.">
      <div className="grid grid-cols-[1.3fr_1fr] gap-[18px] items-start">
        <Panel title="Summary">
          <dl className="text-[14px]">{rows.map(([k, v]) => <div key={k} className="flex py-[8px] border-b border-card-border last:border-0"><dt className="w-[45%] text-text">{k}</dt><dd className="text-ink">{v}</dd></div>)}</dl>
        </Panel>
        <Panel title="Data protection approach">
          <ul className="list-disc pl-[20px] text-[14px] text-text space-y-[4px]">
            <li>Company and officer data from public registers; personal data limited to what registries publish (month and year of birth only).</li>
            <li>Usage logs are visible to the client organisation's administrators only.</li>
            <li>No secrets in the client application; security headers and a content security policy on every host.</li>
            <li>TODO(bid team): DPIA reference, processor terms and sub-processor list.</li>
          </ul>
          <p className="text-[13px] mt-[10px]"><Link to="/status" className="text-primary underline">Service status</Link> · <Link to="/whats-new" className="text-primary underline">What's new</Link> · <Link to="/support" className="text-primary underline">Support</Link></p>
        </Panel>
      </div>
    </PageShell>
  );
}
