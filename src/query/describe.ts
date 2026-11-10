import type { Query } from '../criteria/types';
import { CRITERIA, selectionLabel } from '../criteria/registry';
import { activeCriteria } from './run';
import { countrySummary } from '../components/ui/CountrySelect';

/** Human-readable filters for export "Read me" sheets and report covers. */
export function describeQuery(q: Query | null): string[] {
  if (!q) return [];
  const out = [`Countries: ${countrySummary(q.countries ?? [])}`];
  for (const c of activeCriteria(q)) {
    const def = CRITERIA[c.defId];
    const v = c.value;
    let val: string;
    if (Array.isArray(v)) val = v.length > 3 ? `${v.length} selected` : v.map((id) => def.options?.().find((o) => o.id === id)?.label ?? id).join(', ') || selectionLabel(def, v);
    else if (v && typeof v === 'object') { const r = v as Record<string, unknown>; val = [r.min ?? r.from ?? '…', r.max ?? r.to ?? '…'].join(' to '); }
    else val = String(v ?? '');
    const op = def.operators.find((o) => o.value === c.op)?.label ?? c.op;
    out.push(`${def.label} ${op} ${val}`.trim());
  }
  if (out.length > 2) out.splice(1, 0, `Match ${q.combinator} of the criteria`);
  return out;
}
