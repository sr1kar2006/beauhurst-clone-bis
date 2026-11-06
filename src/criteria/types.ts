import type { Company } from '../data/types';
import type { TreeNode } from '../data/taxonomies/signals';

export type ValueType = 'tree-modal' | 'tree-popover' | 'list-popover' | 'text' | 'range' | 'date-range' | 'boolean';

export interface Range { min?: number | null; max?: number | null }
export interface DateRange { from?: string | null; to?: string | null }
export type CriterionValue = string[] | string | Range | DateRange | null;

export interface Operator { value: string; label: string }
export interface Option { id: string; label: string; hint?: string }

export interface CriterionDef {
  id: string;
  label: string;
  /** sentence fragment before the operator, e.g. "Companies House status" */
  phrase: string;
  /** for two-line layout, word on the second line (usually "of") */
  connector?: string;
  valueType: ValueType;
  layout: 'one-line' | 'two-line';
  operators: Operator[];
  defaultOperator: string;
  trackedOnly?: boolean;
  legacy?: boolean;
  /** £ for money ranges */
  unit?: '£' | '' | 'years';
  options?: () => Option[];
  tree?: TreeNode[];
  predicate: (c: Company, op: string, value: CriterionValue) => boolean;
}

export interface Criterion {
  uid: string;
  defId: string;
  op: string;
  value: CriterionValue;
}

export interface Query {
  entity: 'companies' | 'de' | 'funds';
  combinator: 'all' | 'any';
  criteria: Criterion[];
}

/** Node in the add-criteria picker tree. */
export type PickerNode =
  | { kind: 'criterion'; id: string }
  | { kind: 'group'; id: string; label: string; children: PickerNode[]; legacy?: boolean };
