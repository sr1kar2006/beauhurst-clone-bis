import { Node, parse } from './parse';

/**
 * Translate a formula to an Excel formula template for export/xlsx.ts:
 *   field → {field}  (same-row cell), aggregates → SUM({range:field}) (whole column range).
 * Returns null when the formula uses GROWTH/CAGR (needs history that is not in the sheet): the value is written instead.
 */
export function toExcelTemplate(src: string | Node): string | null {
  const ast = typeof src === 'string' ? parse(src) : src;
  let ok = true;
  const go = (n: Node): string => {
    switch (n.t) {
      case 'num': return String(n.v);
      case 'field': return `{${n.name}}`;
      case 'unary': return `-(${go(n.arg)})`;
      case 'bin': return `(${go(n.l)}${n.op}${go(n.r)})`;
      case 'call': {
        switch (n.fn) {
          case 'SUM': case 'MIN': case 'MAX': case 'MEDIAN': case 'COUNT': {
            if (n.args[0].t !== 'field') { ok = false; return '0'; }
            return `${n.fn}({range:${n.args[0].name}})`;
          }
          case 'AVG': if (n.args[0].t !== 'field') { ok = false; return '0'; } return `AVERAGE({range:${n.args[0].name}})`;
          case 'IF': return `IF(${go(n.args[0])},${go(n.args[1])},${go(n.args[2])})`;
          case 'ROUND': return `ROUND(${go(n.args[0])},${n.args[1] ? go(n.args[1]) : '0'})`;
          case 'ABS': return `ABS(${go(n.args[0])})`;
          case 'RATIO': return `IFERROR(${go(n.args[0])}/${go(n.args[1])},"")`;
          case 'YEAR': return `YEAR(${go(n.args[0])})`;
          default: ok = false; return '0';
        }
      }
    }
  };
  const out = go(ast);
  if (!ok) return null;
  // a plain division should not show #DIV/0! in Excel
  return /\//.test(out) && !/^IFERROR/.test(out) ? `IFERROR(${out},"")` : out;
}
