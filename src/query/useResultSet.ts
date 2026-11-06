import { useMemo } from 'react';
import { useResults } from '../store/resultsStore';
import { getDataset } from '../data/dataset';
import { run } from './run';
import { sortCompanies } from './sort';
import type { Company } from '../data/types';

/** The filtered (unsorted) set for the last search that ran. */
export function useResultSet(): Company[] {
  const ranQuery = useResults((s) => s.ranQuery);
  return useMemo(() => (ranQuery ? run(ranQuery, getDataset(ranQuery.entity)) : []), [ranQuery]);
}

export function useSortedResults(): Company[] {
  const list = useResultSet();
  const sort = useResults((s) => s.sort);
  return useMemo(() => sortCompanies(list, sort), [list, sort]);
}
