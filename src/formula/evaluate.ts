import { Node, parse, FormulaError } from './parse';

export type Value = number | string | null;

/** How the evaluator reads data: a field value for a row, a field's yearly series for GROWTH/CAGR, and all rows for aggregates. */
export interface EvalContext<R> {
  get: (row: R, field: string) => Value;
  series?: (row: R, field: string) => number[] | undefined;
  rows: R[];
}

const toNum = (v: Value): number | null => (typeof v === 'number' && isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) ? Number(v) : null);

function aggregate(fn: string, vals: number[]): number | null {
  if (fn === 'COUNT') return vals.length;
  if (!vals.length) return null;
  switch (fn) {
    case 'SUM': return vals.reduce((s, v) => s + v, 0);
    case 'AVG': return vals.reduce((s, v) => s + v, 0) / vals.length;
    case 'MIN': return Math.min(...vals);
    case 'MAX': return Math.max(...vals);
    case 'MEDIAN': { const s = [...vals].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  }
  return null;
}

/** Compile once, evaluate per row. Aggregates over `ctx.rows` are memoised per node. */
export function compile<R>(src: string | Node, ctx: EvalContext<R>, fields?: Set<string>) {
  const ast = typeof src === 'string' ? parse(src, fields) : src;
  const aggCache = new Map<Node, number | null>();

  const ev = (n: Node, row: R): Value => {
    switch (n.t) {
      case 'num': return n.v;
      case 'field': return ctx.get(row, n.name);
      case 'unary': { const v = toNum(ev(n.arg, row)); return v == null ? null : -v; }
      case 'bin': {
        const a = ev(n.l, row), b = ev(n.r, row);
        const x = toNum(a), y = toNum(b);
        switch (n.op) {
          case '+': return x == null || y == null ? null : x + y;
          case '-': return x == null || y == null ? null : x - y;
          case '*': return x == null || y == null ? null : x * y;
          case '/': return x == null || y == null || y === 0 ? null : x / y;
          case '=': return a === b || (x != null && x === y) ? 1 : 0;
          case '<>': return a === b || (x != null && x === y) ? 0 : 1;
          case '<': return x == null || y == null ? null : x < y ? 1 : 0;
          case '<=': return x == null || y == null ? null : x <= y ? 1 : 0;
          case '>': return x == null || y == null ? null : x > y ? 1 : 0;
          case '>=': return x == null || y == null ? null : x >= y ? 1 : 0;
        }
        return null;
      }
      case 'call': {
        const fn = n.fn;
        if (fn === 'SUM' || fn === 'AVG' || fn === 'MEDIAN' || fn === 'MIN' || fn === 'MAX' || fn === 'COUNT') {
          if (!aggCache.has(n)) aggCache.set(n, aggregate(fn, ctx.rows.map((r) => toNum(ev(n.args[0], r))).filter((v): v is number => v != null)));
          return aggCache.get(n)!;
        }
        const a = n.args.map((x) => x);
        switch (fn) {
          case 'IF': { const c = toNum(ev(a[0], row)); return c ? ev(a[1], row) : ev(a[2], row); }
          case 'ROUND': { const v = toNum(ev(a[0], row)); const d = a[1] ? toNum(ev(a[1], row)) ?? 0 : 0; if (v == null) return null; const f = Math.pow(10, d); return Math.round(v * f) / f; }
          case 'ABS': { const v = toNum(ev(a[0], row)); return v == null ? null : Math.abs(v); }
          case 'RATIO': { const x = toNum(ev(a[0], row)), y = toNum(ev(a[1], row)); return x == null || y == null || y === 0 ? null : x / y; }
          case 'YEAR': { const v = ev(a[0], row); if (typeof v === 'string' && /^\d{4}/.test(v)) return Number(v.slice(0, 4)); return null; }
          case 'GROWTH': case 'CAGR': {
            const field = (a[0] as Extract<Node, { t: 'field' }>).name;
            const years = toNum(ev(a[1], row)) ?? 1;
            const s = ctx.series?.(row, field);
            if (!s || s.length <= years || years < 1) return null;
            const last = s[s.length - 1], first = s[s.length - 1 - years];
            if (fn === 'GROWTH') return first ? ((last - first) / Math.abs(first)) * 100 : null;
            return last > 0 && first > 0 ? (Math.pow(last / first, 1 / years) - 1) * 100 : null;
          }
        }
        return null;
      }
    }
  };
  return { ast, evaluate: (row: R) => ev(ast, row) };
}

/** Validate without data: returns null when valid, else the message and position. */
export function validate(src: string, fields: Set<string>): { message: string; pos: number } | null {
  try { parse(src, fields); return null; } catch (e) {
    if (e instanceof FormulaError) return { message: e.message, pos: e.pos };
    return { message: String(e), pos: 0 };
  }
}
