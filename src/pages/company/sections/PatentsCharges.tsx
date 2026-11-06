import type { SectionProps } from '../CompanyPage';
import { formatDate } from '../../../lib/format';
import { Card, SectionTitle } from '../ui';

const th = 'py-[9px] px-[10px] text-left text-[14px] font-semibold text-ink border-b border-card-border';
const td = 'py-[9px] px-[10px] text-[14px] border-b border-card-border align-top';

export function Patents({ p }: SectionProps) {
  return (
    <>
      <SectionTitle>Patents</SectionTitle>
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>Title</th><th className={th}>Application no.</th><th className={th}>Filed</th><th className={th}>Status</th><th className={th}>Jurisdiction</th></tr></thead>
          <tbody>{p.patents.map((x) => <tr key={x.applicationNo}><td className={td}>{x.title}</td><td className={`${td} font-mono text-[13px]`}>{x.applicationNo}</td><td className={td}>{formatDate(x.filed)}</td><td className={td}>{x.status}</td><td className={td}>{x.jurisdiction}</td></tr>)}</tbody>
        </table>
      </Card>
    </>
  );
}

export function ChargesMortgages({ p }: SectionProps) {
  return (
    <>
      <SectionTitle>Charges &amp; Mortgages</SectionTitle>
      <Card>
        <table className="w-full">
          <thead><tr><th className={th}>Created</th><th className={th}>Delivered</th><th className={th}>Status</th><th className={th}>Persons entitled</th><th className={th}>Description</th></tr></thead>
          <tbody>{p.charges.map((x, i) => <tr key={i}><td className={td}>{formatDate(x.created)}</td><td className={td}>{formatDate(x.delivered)}</td><td className={td}>{x.status}</td><td className={td}>{x.entitled}</td><td className={`${td} text-text`}>{x.description}</td></tr>)}</tbody>
        </table>
      </Card>
    </>
  );
}
