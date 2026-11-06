import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useQuery, selectQuery } from '../../store/queryStore';
import { useResults } from '../../store/resultsStore';
import { useUi } from '../../store/uiStore';
import { SentenceHeader } from './SentenceHeader';
import { CriterionRow } from './CriterionRow';
import { AddCriteriaPopover, PICKER_ID } from './AddCriteriaPopover';
import { ENTITY_LABELS } from './entity';
import { Button } from '../ui/Button';

export function QueryBuilder() {
  const criteria = useQuery((s) => s.criteria);
  const combinator = useQuery((s) => s.combinator);
  const entity = useQuery((s) => s.entity);
  const runSearch = useResults((s) => s.runSearch);
  const toggle = useUi((s) => s.toggle);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <section className="bg-surface border border-border rounded-card" aria-label="Query builder">
      <SentenceHeader />
      <div>
        {criteria.map((c, i) => <CriterionRow key={c.uid} c={c} index={i} combinator={combinator} />)}
      </div>
      <div className="flex items-center justify-between px-[20px] py-[16px]">
        <button
          ref={setAnchor}
          data-tour="add-criteria"
          onClick={() => toggle(PICKER_ID)}
          className="inline-flex items-center gap-[5px] text-[15px] text-primary underline underline-offset-2 hover:text-primary-hover"
        >
          <Plus size={16} strokeWidth={2.5} />
          {ENTITY_LABELS[entity].add}
        </button>
        <Button tourKey="search-button" onClick={() => runSearch(selectQuery(useQuery.getState()))}>
          <Search size={15} strokeWidth={2.5} />
          {ENTITY_LABELS[entity].button}
        </Button>
      </div>
      <AddCriteriaPopover anchor={anchor} />
    </section>
  );
}
