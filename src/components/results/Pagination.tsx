import { useResults } from '../../store/resultsStore';
import { pageCount, pageItems } from '../../query/sort';
import { CompactSelect } from '../ui/CompactSelect';

export function Pagination({ total }: { total: number }) {
  const page = useResults((s) => s.page);
  const size = useResults((s) => s.pageSize);
  const setPage = useResults((s) => s.setPage);
  const setSize = useResults((s) => s.setPageSize);
  const pages = pageCount(total, size);

  const nav = 'h-[30px] px-[10px] text-[15px] rounded-btn';
  return (
    <nav className="flex items-center gap-[4px] text-[15px]" aria-label="Pagination">
      <button className={`${nav} ${page === 1 ? 'text-muted cursor-default' : 'text-primary hover:bg-primary-light'}`} disabled={page === 1} onClick={() => setPage(page - 1)}>
        Prev
      </button>
      {pageItems(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-[6px] text-text">…</span>
        ) : (
          <button
            key={p}
            onClick={() => setPage(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[30px] h-[30px] px-[8px] rounded-btn ${p === page ? 'bg-tab-active text-white' : 'text-primary hover:bg-primary-light'}`}
          >
            {p}
          </button>
        ),
      )}
      <button className={`${nav} ${page === pages ? 'text-muted cursor-default' : 'text-primary hover:bg-primary-light'}`} disabled={page === pages} onClick={() => setPage(page + 1)}>
        Next
      </button>
      <span className="mx-[8px] h-[20px] w-px bg-border" />
      <span className="text-text mr-[6px]">Show</span>
      <CompactSelect
        ariaLabel="Results per page"
        value={String(size)}
        onChange={(v) => setSize(Number(v))}
        options={['10', '20', '50', '100'].map((v) => ({ value: v, label: v }))}
      />
    </nav>
  );
}
