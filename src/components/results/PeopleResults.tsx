import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Person } from '../../data/persons';
import { currentAppointments, previousAppointments } from '../../data/persons';
import { getCompany } from '../../data/dataset';
import { countryName } from '../../data/countries/iso3166';
import { profilePath } from '../../lib/nav';
import { formatInt } from '../../lib/format';
import { Flag } from '../ui/Flag';
import { PersonName } from '../people/PersonName';
import { ExportMenu } from '../../export/ExportMenu';
import type { ExportSpec } from '../../export/types';
import { describeQuery } from '../../query/describe';
import { useResults } from '../../store/resultsStore';

const PAGE = 25;

export function peopleSpec(rows: Person[], filters: string[]): ExportSpec {
  return {
    title: 'People search results', subtitle: `${rows.length.toLocaleString('en-GB')} people`, filtersUsed: filters, viewPath: '/', sources: ['companies-house', 'cro', 'national-registers'],
    sheets: [{ name: 'People', columns: [{ key: 'name', label: 'Name' }, { key: 'country', label: 'Country of residence' }, { key: 'cur', label: 'Current appointments', format: 'int' }, { key: 'prev', label: 'Previous appointments', format: 'int' }, { key: 'companies', label: 'Companies', width: 70 }],
      rows: rows.map((p) => ({ name: p.name, country: countryName(p.country), cur: currentAppointments(p).length, prev: previousAppointments(p).length, companies: p.appointments.map((a) => getCompany(a.companyId)?.name).join('; ') })) }],
  };
}

/** Results for `Find [people] where …`. */
export function PeopleResults({ rows }: { rows: Person[] }) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<'name' | 'current' | 'previous'>('current');
  const ranQuery = useResults((s) => s.ranQuery);
  const sorted = useMemo(() => [...rows].sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name)
    : sort === 'current' ? currentAppointments(b).length - currentAppointments(a).length || a.name.localeCompare(b.name)
      : previousAppointments(b).length - previousAppointments(a).length || a.name.localeCompare(b.name)), [rows, sort]);
  const shown = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const head = (k: typeof sort, l: string) => <th className="text-left px-[14px] py-[10px] text-[14px] font-semibold text-ink border-b border-border" aria-sort={sort === k ? 'descending' : 'none'}><button onClick={() => { setSort(k); setPage(0); }} className="hover:text-primary">{l}{sort === k ? ' ▼' : ''}</button></th>;
  return (
    <div className="max-w-content mx-auto" data-people-results>
      <div className="flex items-center justify-between mb-[12px]">
        <p className="text-[15px] text-text"><strong className="text-ink">{formatInt(rows.length)} people</strong> found</p>
        <ExportMenu label={`Export all ${formatInt(rows.length)} people`} build={() => peopleSpec(sorted, describeQuery(ranQuery))} filename="people-results" />
      </div>
      <div className="bg-white border border-border rounded-card overflow-x-auto">
        <table className="w-full border-collapse" aria-label="People results">
          <thead><tr>{head('name', 'Name')}<th className="text-left px-[14px] py-[10px] text-[14px] font-semibold text-ink border-b border-border">Country</th>{head('current', 'Current appointments')}{head('previous', 'Previous appointments')}<th className="text-left px-[14px] py-[10px] text-[14px] font-semibold text-ink border-b border-border">Companies</th></tr></thead>
          <tbody>
            {shown.map((p) => {
              const cos = p.appointments.map((a) => getCompany(a.companyId)).filter(Boolean);
              return (
                <tr key={p.id} className="border-b border-card-border last:border-0 hover:bg-[#FAFAFA]" data-person-row={p.id}>
                  <td className="px-[14px] py-[10px] text-[15px] font-semibold"><PersonName id={p.id} name={p.name} /></td>
                  <td className="px-[14px] py-[10px] text-[14px]"><span className="inline-flex items-center gap-[5px]"><Flag code={p.country} className="text-[13px]" />{countryName(p.country)}</span></td>
                  <td className="px-[14px] py-[10px] text-[14px] tabular-nums">{currentAppointments(p).length}</td>
                  <td className="px-[14px] py-[10px] text-[14px] tabular-nums">{previousAppointments(p).length}</td>
                  <td className="px-[14px] py-[10px] text-[14px]">
                    {cos.slice(0, 3).map((c, i) => <span key={c!.id}>{i > 0 && ', '}<Link to={profilePath(c!.id)} className="text-primary hover:underline">{c!.name}</Link></span>)}
                    {cos.length > 3 && <span className="text-text"> and {cos.length - 3} more</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-[8px] mt-[10px] text-[14px]">
        <button onClick={() => setPage(page - 1)} disabled={page === 0} className="h-[28px] px-[10px] border border-border rounded-btn disabled:opacity-40">Previous</button>
        <span>Page {page + 1} of {pages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= pages - 1} className="h-[28px] px-[10px] border border-border rounded-btn disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
