/**
 * Formula language for calculated columns and report metrics. Hand-written tokenizer + Pratt parser (no eval).
 *   numbers, field names (e.g. turnover, employees), + - * / ( ) , and comparisons = <> < <= > >= (for IF)
 *   functions: SUM AVG MEDIAN MIN MAX COUNT (column aggregates), IF ROUND ABS GROWTH CAGR RATIO YEAR
 */
export type Node =
  | { t: 'num'; v: number; pos: number }
  | { t: 'field'; name: string; pos: number }
  | { t: 'unary'; op: '-'; arg: Node; pos: number }
  | { t: 'bin'; op: string; l: Node; r: Node; pos: number }
  | { t: 'call'; fn: string; args: Node[]; pos: number };

export class FormulaError extends Error {
  constructor(message: string, public pos: number) { super(message); }
}

export const AGGREGATES = ['SUM', 'AVG', 'MEDIAN', 'MIN', 'MAX', 'COUNT'] as const;
export const ROW_FUNCS = ['IF', 'ROUND', 'ABS', 'GROWTH', 'CAGR', 'RATIO', 'YEAR'] as const;
export const FUNCTIONS = [...AGGREGATES, ...ROW_FUNCS] as const;
const ARITY: Record<string, [number, number]> = {
  SUM: [1, 1], AVG: [1, 1], MEDIAN: [1, 1], MIN: [1, 1], MAX: [1, 1], COUNT: [1, 1],
  IF: [3, 3], ROUND: [1, 2], ABS: [1, 1], GROWTH: [2, 2], CAGR: [2, 2], RATIO: [2, 2], YEAR: [1, 1],
};

type Tok = { k: 'num'; v: number; pos: number } | { k: 'id'; v: string; pos: number } | { k: 'op'; v: string; pos: number } | { k: 'end'; pos: number };

export function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) throw new FormulaError(`Unexpected "${ch}"`, i);
      out.push({ k: 'num', v: Number(m[0]), pos: i }); i += m[0].length; continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!;
      out.push({ k: 'id', v: m[0], pos: i }); i += m[0].length; continue;
    }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '<>'].includes(two)) { out.push({ k: 'op', v: two, pos: i }); i += 2; continue; }
    if ('+-*/(),<>='.includes(ch)) { out.push({ k: 'op', v: ch, pos: i }); i++; continue; }
    throw new FormulaError(`Unexpected character "${ch}"`, i);
  }
  out.push({ k: 'end', pos: src.length });
  return out;
}

const BP: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '<=': 1, '>': 1, '>=': 1, '+': 2, '-': 2, '*': 3, '/': 3 };

export function parse(src: string, fields?: Set<string>): Node {
  if (!src.trim()) throw new FormulaError('Enter a formula', 0);
  const toks = tokenize(src.replace(/^\s*=/, ' '));
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const expectOp = (v: string) => {
    const t = next();
    if (t.k !== 'op' || t.v !== v) throw new FormulaError(t.k === 'end' ? `Missing "${v}"` : `Expected "${v}"`, t.pos);
  };

  const prefix = (): Node => {
    const t = next();
    if (t.k === 'num') return { t: 'num', v: t.v, pos: t.pos };
    if (t.k === 'op' && t.v === '-') return { t: 'unary', op: '-', arg: expr(4), pos: t.pos };
    if (t.k === 'op' && t.v === '+') return expr(4);
    if (t.k === 'op' && t.v === '(') { const e = expr(0); expectOp(')'); return e; }
    if (t.k === 'id') {
      const nt = peek();
      if (nt.k === 'op' && nt.v === '(') {
        const fn = t.v.toUpperCase();
        if (!ARITY[fn]) throw new FormulaError(`Unknown function ${t.v}`, t.pos);
        next();
        const args: Node[] = [];
        if (!(peek().k === 'op' && (peek() as { v: string }).v === ')')) {
          args.push(expr(0));
          while (peek().k === 'op' && (peek() as { v: string }).v === ',') { next(); args.push(expr(0)); }
        }
        expectOp(')');
        const [lo, hi] = ARITY[fn];
        if (args.length < lo || args.length > hi) throw new FormulaError(`${fn} takes ${lo === hi ? lo : `${lo} to ${hi}`} argument${hi > 1 ? 's' : ''}`, t.pos);
        if ((fn === 'GROWTH' || fn === 'CAGR') && args[0].t !== 'field') throw new FormulaError(`${fn} needs a field as its first argument`, t.pos);
        return { t: 'call', fn, args, pos: t.pos };
      }
      if (fields && !fields.has(t.v)) throw new FormulaError(`Unknown field "${t.v}"`, t.pos);
      return { t: 'field', name: t.v, pos: t.pos };
    }
    if (t.k === 'end') throw new FormulaError('Formula ends too early', t.pos);
    throw new FormulaError(`Unexpected "${(t as { v: string }).v}"`, t.pos);
  };

  const expr = (rbp: number): Node => {
    let left = prefix();
    for (;;) {
      const t = peek();
      if (t.k !== 'op' || !(t.v in BP) || BP[t.v] <= rbp) break;
      next();
      left = { t: 'bin', op: t.v, l: left, r: expr(BP[t.v]), pos: t.pos };
    }
    return left;
  };

  const e = expr(0);
  const t = peek();
  if (t.k !== 'end') throw new FormulaError(`Unexpected "${(t as { v: string }).v}"`, t.pos);
  return e;
}

/** Field names a formula refers to. */
export function fieldsOf(n: Node, out = new Set<string>()): Set<string> {
  if (n.t === 'field') out.add(n.name);
  else if (n.t === 'unary') fieldsOf(n.arg, out);
  else if (n.t === 'bin') { fieldsOf(n.l, out); fieldsOf(n.r, out); }
  else if (n.t === 'call') n.args.forEach((a) => fieldsOf(a, out));
  return out;
}
