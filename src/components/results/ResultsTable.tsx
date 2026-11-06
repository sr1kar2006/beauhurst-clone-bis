import { ChevronDown, ChevronUp, Eye, IdCard, ListPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { profilePath } from '../../lib/nav';
import type { Company } from '../../data/types';
import { ALL_COLUMNS, ColumnId, useResults } from '../../store/resultsStore';
import { useUi } from '../../store/uiStore';
import { Cell, COLUMN_WIDTH, SORTABLE } from './cells';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="inline-flex flex-col -space-y-[5px] ml-[4px]" aria-hidden>
      <ChevronUp size={11} strokeWidth={3} className={active && dir === 'asc' ? 'text-ink' : 'text-[#C4C4C4]'} />
      <ChevronDown size={11} strokeWidth={3} className={active && dir === 'desc' ? 'text-ink' : 'text-[#C4C4C4]'} />
    </span>
  );
}

export function ResultsTable({ rows }: { rows: Company[] }) {
  const columns = useResults((s) => s.columns);
  const sort = useResults((s) => s.sort);
  const setSort = useResults((s) => s.setSort);
  const openProfile = useResults((s) => s.openProfile);
  const setTarget = useResults((s) => s.setCollectionTarget);
  const open = useUi((s) => s.open);
  const labels = new Map(ALL_COLUMNS.map((c) => [c.id, c.label]));

  const cols = columns.includes('name') ? columns : (['name', ...columns] as ColumnId[]);
  const rest = cols.filter((c) => c !== 'name');
  const template = `${COLUMN_WIDTH.name} ${rest.map((c) => COLUMN_WIDTH[c]).join(' ')} 156px`;

  const onSort = (col: ColumnId) => {
    const key = SORTABLE[col];
    if (!key) return;
    const dir = sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc';
    setSort({ key, dir: sort.key === key ? dir : key === 'name' ? 'asc' : 'desc' });
  };

  return (
    <div className="bg-surface border border-border rounded-card overflow-x-auto" role="table" aria-label="Search results" data-tour="results-table">
      <div className="grid items-center gap-x-[18px] px-[18px] h-[46px] border-b border-border text-[14px] font-semibold text-ink min-w-[900px]" style={{ gridTemplateColumns: template }} role="row">
        {cols.map((col) => {
          const key = SORTABLE[col];
          const active = !!key && sort.key === key;
          return key ? (
            <button key={col} role="columnheader" data-tour={`sort-${col}`} onClick={() => onSort(col)} className="flex items-center text-left hover:text-primary" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
              {labels.get(col)}
              <SortIcon active={active} dir={sort.dir} />
            </button>
          ) : (
            <span key={col} role="columnheader">{labels.get(col)}</span>
          );
        })}
        <span />
      </div>
      {rows.map((c) => (
        <div
          key={c.id}
          role="row"
          className="grid gap-x-[18px] px-[18px] py-[12px] border-b border-border last:border-b-0 hover:bg-[#FAFAFA] text-[14px] text-text min-w-[900px]"
          style={{ gridTemplateColumns: template, gridTemplateRows: 'auto auto' }}
        >
          <div className="row-span-2 flex items-center gap-[14px] min-w-0" role="cell">
            <img src={c.logo} alt="" className="w-[52px] h-[52px] border border-border rounded-[2px] shrink-0 bg-white" loading="lazy" />
            <Link to={profilePath(c.id)} data-company-link className="text-left text-[15px] font-semibold text-ink hover:text-primary hover:underline truncate">
              {c.name}
            </Link>
          </div>
          {rest.map((col) => (
            <div key={col} role="cell" className="min-w-0 self-end pt-[4px]"><Cell c={c} col={col} /></div>
          ))}
          <div className="row-span-2 flex items-center justify-end gap-[6px]">
            <Link
              to={profilePath(c.id)}
              aria-label={`View ${c.name} profile`}
              title="View full company profile"
              data-view-profile
              className="h-[30px] px-[9px] flex items-center gap-[5px] border border-primary rounded-btn bg-white text-primary text-[13px] font-semibold hover:bg-primary-light whitespace-nowrap"
            >
              <IdCard size={15} /> Profile
            </Link>
            <button
              aria-label={`Quick view ${c.name}`}
              title="Quick view"
              onClick={() => openProfile(c.id)}
              className="w-[30px] h-[30px] flex items-center justify-center border border-border bg-white text-text rounded-btn hover:border-primary hover:text-primary"
            >
              <Eye size={15} />
            </button>
            <button
              aria-label={`Add ${c.name} to collection`}
              title="Add to collection"
              onClick={() => { setTarget([c.id]); open('collection-modal', 'modal'); }}
              className="w-[30px] h-[30px] flex items-center justify-center border border-primary/40 bg-primary-light text-primary rounded-btn hover:border-primary"
            >
              <ListPlus size={16} />
            </button>
          </div>
          <div className="truncate text-[14px] text-muted pt-[4px]" style={{ gridColumn: `2 / span ${rest.length}` }} title={c.description}>
            {c.description}
          </div>
        </div>
      ))}
      {!rows.length && <div className="px-[18px] py-[40px] text-center text-text">No companies match your search. Try removing a criterion.</div>}
    </div>
  );
}
