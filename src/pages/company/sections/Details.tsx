import { Eye, Search } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import { INDUSTRY_BY_ID } from '../../../data/taxonomies/industries';
import { SIC_CODES } from '../../../data/taxonomies/misc';
import { formatDate } from '../../../lib/format';
import { FlagGB } from '../../../components/builder/icons';
import { Card, EmptyState, KeyValueTable, PairChip, SectionTitle, Tip } from '../ui';
import { SocialIcons } from './Summary';

const STAGE_EXPLAIN: Record<string, string> = {
  Seed: 'Early stage: typically pre-revenue or with first customers, funded by founders, angels or seed rounds.',
  Venture: 'Has raised venture capital and is building traction.',
  Growth: 'Scaling quickly with significant revenue and later-stage funding.',
  Established: 'A mature, sustainable business with significant revenue or more than £20m raised.',
  Zombie: 'No sign of activity or growth for several years.',
  Exited: 'Has been acquired or listed.',
  Dead: 'Dissolved or in liquidation.',
};

export function Details({ c, p }: SectionProps) {
  const ind = c.industries.map((id) => INDUSTRY_BY_ID.get(id)!).filter(Boolean);
  const list = (items: string[]) => items.length ? <ul className="list-disc pl-[18px] space-y-[2px]">{items.map((i) => <li key={i}>{i}</li>)}</ul> : <span className="text-muted">—</span>;
  const sic = (code: string) => `${code} - ${SIC_CODES.find((s) => s.code === code)?.label ?? 'Activities of holding companies'}`;
  const addr = (lines: string[]) => <div>{lines.map((l) => <div key={l}>{l}</div>)}</div>;
  const chips = <div className="flex flex-col gap-[5px] items-start">{p.locationHierarchy.map((l) => <PairChip key={l.type} value={l.type === 'Country' ? <span className="inline-flex items-center gap-[5px]"><FlagGB />{l.value}</span> : l.value} type={l.type} />)}</div>;
  const th = 'py-[8px] px-[8px] text-left text-[14px] font-semibold text-ink border-b border-card-border';
  const td = 'py-[8px] px-[8px] text-[14px] border-b border-card-border';

  return (
    <>
      <SectionTitle>Details</SectionTitle>
      <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-[16px] items-start">
        <div className="space-y-[16px]">
          <Card title="Description & Classifiers" tourKey="details-description">
            <div className="grid grid-cols-2 gap-[20px] text-[14px] text-ink">
              <div className="space-y-[12px]">
                <div><div className="font-semibold mb-[4px]">Industries</div>{list(ind.filter((i) => i.type === 'industry').map((i) => i.label))}</div>
                <div><div className="font-semibold mb-[4px]">Buzzwords</div>{list(ind.filter((i) => i.type === 'buzzword').map((i) => i.label))}</div>
              </div>
              <div className="space-y-[12px]">
                <div><div className="font-semibold mb-[4px]">Sectors</div>{list(p.sectors)}</div>
                <div><div className="font-semibold mb-[4px]">Target Markets</div>{list(c.targetMarkets)}</div>
              </div>
            </div>
            <div className="border-t border-card-border mt-[14px] pt-[12px] space-y-[10px] text-[14px]">
              <div><div className="font-semibold text-ink">Description</div><p className="text-text">{c.description}</p></div>
              <div><div className="font-semibold text-ink">Description in own words</div><p className="text-text">{p.descriptionOwnWords}</p></div>
              <div><span className="font-semibold text-ink">Source: </span>{c.website ? <a href={c.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.website.replace(/^https?:\/\//, '')}</a> : '—'}</div>
            </div>
          </Card>
          <Card title="Name and Legal Entity">
            <KeyValueTable rows={[
              ['Trading name', p.tradingName],
              ['Registered name', p.registeredName],
              ['Companies House ID', <a key="ch" href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{c.companiesHouseId}</a>],
              ['Incorporation date (Companies House)', formatDate(p.incorporationDate)],
              [<span key="a" className="inline-flex items-center gap-[4px]">Alternative establishment date <Tip text="The date the business started trading, if earlier than incorporation."><span className="text-muted">ⓘ</span></Tip></span>, formatDate(p.altEstablishmentDate)],
              ['Other trading names', p.otherTradingNames.join(', ') || '—'],
              ['Legal form', p.legalForm],
              ['SME Status', <Tip key="sme" text="Small and medium-sized enterprise: fewer than 250 employees."><abbr className="no-underline border-b border-dotted border-text cursor-help">{p.smeStatus}</abbr></Tip>],
              ['SIC Codes (2007)', list(c.sicCodes.map(sic))],
              ['Business description (from filings)', c.businessDescription],
            ]} />
          </Card>
          <Card title="Academic Spinouts">
            {c.signals.includes('innovation:academic-spinout')
              ? <p className="text-[14px] text-ink">Spun out of the University of Eastmoor.</p>
              : <EmptyState title="No known spinout activity">This company was not spun out from an academic institution</EmptyState>}
          </Card>
          <Card title="Accelerator attendances">
            {p.accelerators.length ? (
              <table className="w-full"><thead><tr><th className={th}>Accelerator</th><th className={th}>Start Date</th><th className={th}>End Date</th><th className={th}>Source</th></tr></thead>
                <tbody>{p.accelerators.map((a) => <tr key={a.name}><td className={td}><a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{a.name}</a></td><td className={td}>{formatDate(a.start)}</td><td className={td}>{formatDate(a.end)}</td><td className={td}><a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">Link</a></td></tr>)}</tbody></table>
            ) : <EmptyState title="No known accelerator attendances" />}
          </Card>
          <Card title="High Growth Lists">
            {p.highGrowthLists.length ? (
              <table className="w-full"><thead><tr><th className={th}>List name</th><th className={th}>Cohort year</th><th className={th}>Announced date</th><th className={th}>Source</th></tr></thead>
                <tbody>{p.highGrowthLists.map((h) => <tr key={h.name}><td className={td}><a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{h.name}</a></td><td className={td}>{h.cohort}</td><td className={td}>{formatDate(h.announced)}</td><td className={td}><a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">Link</a></td></tr>)}</tbody></table>
            ) : <EmptyState title="Not on any high growth lists" />}
          </Card>
        </div>

        <div className="space-y-[16px]">
          <Card title="Status">
            <KeyValueTable rows={[
              ['Tracking status', <span key="t" className="inline-flex items-center gap-[5px]"><Eye size={15} className="text-bar-green" />{c.trackingStatus}</span>],
              ['Stage of evolution', <div key="s"><span className="inline-flex items-center gap-[5px] font-medium">{c.stage} <Search size={13} className="text-muted" /></span><div className="text-[13px] text-muted mt-[2px]">{STAGE_EXPLAIN[c.stage]}</div></div>],
              ['Actively hiring', p.activelyHiring ? <span key="h">Yes (<a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">See open job roles</a>)</span> : 'No'],
              ['Companies House status', c.chStatus],
            ]} />
          </Card>
          <Card title="Contact">
            <KeyValueTable rows={[
              ['Website', c.website ? <a key="w" href={c.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{c.website.replace(/^https?:\/\//, '')}</a> : '—'],
              ['General phone number', p.contact.phone ?? '—'],
              ['Email Addresses', p.contact.emails.join(', ') || '—'],
              ['Social media', <SocialIcons key="s" socials={p.contact.socials} />],
              ['App Stores', p.contact.appStores.length ? <div key="a" className="flex gap-[6px]">{p.contact.appStores.map((s) => <span key={s} className="px-[8px] py-[3px] border border-border rounded-btn text-[13px]">{s}</span>)}</div> : '—'],
            ]} />
          </Card>
          <Card title="Location">
            <KeyValueTable rows={[
              ['Head office address', addr(p.addresses.headOffice)],
              ['Head office location', chips],
              ['Registered address', addr(p.addresses.registered)],
              ['Registered address location', chips],
              ['Trading address(es)', p.addresses.trading.length ? <div key="t" className="space-y-[6px]">{p.addresses.trading.map((a, i) => <div key={i}>{addr(a)}</div>)}</div> : '—'],
            ]} />
          </Card>
          <Card title="COVID-19">
            <ul className="list-disc pl-[18px] text-[14px] text-ink"><li><span className="text-text">Overall COVID-19 status: </span>{p.covidStatus}</li></ul>
          </Card>
          <Card title="Technology">
            <table className="w-full text-[14px]">
              <tbody>{p.technology.map((t) => (
                <tr key={t.category} className="border-b border-card-border last:border-0 align-top">
                  <th scope="row" className="text-left font-normal text-text py-[8px] pr-3 w-[45%]">{t.category}</th>
                  <td className="py-[8px]">{t.items.map((i, k) => <span key={i}>{k > 0 && ', '}<a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{i}</a></span>)}</td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
