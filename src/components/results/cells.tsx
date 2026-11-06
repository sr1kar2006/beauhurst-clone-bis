import type { Company } from '../../data/types';
import type { ColumnId } from '../../store/resultsStore';
import { INDUSTRY_BY_ID } from '../../data/taxonomies/industries';
import { SIGNAL_LABEL } from '../../data/taxonomies/signals';
import { formatDate, formatInt, formatMoney, joinAnd } from '../../lib/format';
import { FlagDE, FlagGB } from '../builder/icons';
import type { SortKey } from '../../query/sort';

export const industryLabels = (c: Company) => c.industries.map((id) => INDUSTRY_BY_ID.get(id)?.label ?? id);

export const COLUMN_WIDTH: Record<ColumnId, string> = {
  name: '270px',
  industries: 'minmax(180px, 1.7fr)',
  headOffice: 'minmax(130px, 1fr)',
  fundraisingTotal: '130px',
  latestFundraisingDate: '140px',
  turnover: '110px',
  employees: '100px',
  stage: '120px',
  foundedDate: '110px',
  website: 'minmax(140px, 1fr)',
  chStatus: '130px',
  signals: 'minmax(140px, 1fr)',
};

export const SORTABLE: Partial<Record<ColumnId, SortKey>> = {
  name: 'name',
  fundraisingTotal: 'fundraisingTotal',
  latestFundraisingDate: 'latestFundraisingDate',
  turnover: 'turnover',
  employees: 'employees',
  foundedDate: 'foundedDate',
};

export function cellText(c: Company, col: ColumnId): string {
  switch (col) {
    case 'name': return c.name;
    case 'industries': return joinAnd(industryLabels(c));
    case 'headOffice': return c.headOffice;
    case 'fundraisingTotal': return formatMoney(c.fundraisingTotal);
    case 'latestFundraisingDate': return formatDate(c.latestFundraisingDate);
    case 'turnover': return formatMoney(c.turnover);
    case 'employees': return c.employees != null ? formatInt(c.employees) : '';
    case 'stage': return c.stage;
    case 'foundedDate': return formatDate(c.foundedDate);
    case 'website': return c.website?.replace(/^https?:\/\/(www\.)?/, '') ?? '';
    case 'chStatus': return c.chStatus;
    case 'signals': return joinAnd(c.signals.map((s) => SIGNAL_LABEL.get(s) ?? s));
  }
}

export function Cell({ c, col }: { c: Company; col: ColumnId }) {
  const txt = cellText(c, col);
  if (col === 'headOffice') {
    const de = c.id.startsWith('de');
    return (
      <span className="flex items-center gap-[7px] min-w-0">
        {de ? <FlagDE /> : <FlagGB />}
        <span className="truncate">{txt}</span>
      </span>
    );
  }
  if (col === 'website' && c.website) {
    return <a href={c.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate block" onClick={(e) => e.stopPropagation()}>{txt}</a>;
  }
  return <span className="truncate block" title={txt}>{txt}</span>;
}
