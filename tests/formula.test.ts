import { describe, expect, it } from 'vitest';
import { parse, tokenize, FormulaError, fieldsOf } from '../src/formula/parse';
import { compile, validate } from '../src/formula/evaluate';
import { toExcelTemplate } from '../src/formula/excel';
import { formulaToA1, colLetter } from '../src/export/xlsx';

type Row = { turnover: number | null; employees: number | null; founded: string; hist: number[] };
const rows: Row[] = [
  { turnover: 1000, employees: 10, founded: '2015-03-01', hist: [500, 800, 1000] },
  { turnover: 3000, employees: 0, founded: '2020-06-12', hist: [3000] },
  { turnover: null, employees: 5, founded: '2019-01-01', hist: [] },
  { turnover: 2000, employees: 20, founded: '2010-11-30', hist: [1000, 1250, 1600, 2000] },
];
const ctx = { rows, get: (r: Row, f: string) => (r as unknown as Record<string, number | string | null>)[f] ?? null, series: (r: Row) => r.hist };
const FIELDS = new Set(['turnover', 'employees', 'founded']);
const run = (src: string) => { const f = compile(src, ctx, FIELDS); return rows.map(f.evaluate); };

describe('tokenizer and parser', () => {
  it('tokenizes numbers, identifiers and two-char operators', () => {
    expect(tokenize('a<=1.5e2').map((t) => ('v' in t ? t.v : 'END'))).toEqual(['a', '<=', 150, 'END']);
  });
  it('respects precedence and parentheses', () => {
    expect(compile('1 + 2 * 3', ctx).evaluate(rows[0])).toBe(7);
    expect(compile('(1 + 2) * 3', ctx).evaluate(rows[0])).toBe(9);
    expect(compile('-2 * -3', ctx).evaluate(rows[0])).toBe(6);
    expect(compile('10 / 4 - 1', ctx).evaluate(rows[0])).toBe(1.5);
  });
  it('accepts a leading = like Excel', () => { expect(compile('=2+2', ctx).evaluate(rows[0])).toBe(4); });
  it('collects referenced fields', () => { expect([...fieldsOf(parse('RATIO(turnover, employees) + SUM(turnover)'))].sort()).toEqual(['employees', 'turnover']); });
  it('never uses eval: unknown identifiers are errors, not code', () => {
    expect(() => parse('alert(1)', FIELDS)).toThrow(FormulaError);
    expect(() => parse('constructor', FIELDS)).toThrow(/Unknown field/);
  });
});

describe('validation errors with positions', () => {
  it.each([
    ['', 'Enter a formula', 0],
    ['turnover +', 'Formula ends too early', 10],
    ['turnover / (employees', 'Missing ")"', 21],
    ['turnovr / employees', 'Unknown field "turnovr"', 0],
    ['FOO(turnover)', 'Unknown function FOO', 0],
    ['ROUND()', 'ROUND takes 1 to 2 arguments', 0],
    ['turnover $ 2', 'Unexpected character "$"', 9],
    ['GROWTH(2, 3)', 'GROWTH needs a field as its first argument', 0],
    ['1 2', 'Unexpected "2"', 2],
  ])('%s → %s', (src, msg, pos) => {
    expect(validate(src, FIELDS)).toEqual({ message: msg, pos });
  });
  it('valid formulas return null', () => { expect(validate('turnover / employees', FIELDS)).toBeNull(); });
});

describe('evaluation', () => {
  it('turnover / employees, with nulls and divide-by-zero as blanks', () => { expect(run('turnover / employees')).toEqual([100, null, null, 100]); });
  it('aggregates run over all rows', () => {
    expect(run('SUM(turnover)')[0]).toBe(6000);
    expect(run('AVG(turnover)')[0]).toBe(2000);
    expect(run('MEDIAN(turnover)')[0]).toBe(2000);
    expect(run('MIN(employees)')[0]).toBe(0);
    expect(run('MAX(employees)')[0]).toBe(20);
    expect(run('COUNT(turnover)')[0]).toBe(3);
    expect(run('turnover / SUM(turnover) * 100').map((v) => (v == null ? v : Math.round(v as number)))).toEqual([17, 50, null, 33]);
  });
  it('IF with comparisons', () => { expect(run('IF(turnover >= 2000, 1, 0)')).toEqual([0, 1, 0, 1]); expect(run('IF(employees = 0, 99, employees)')).toEqual([10, 99, 5, 20]); });
  it('ROUND, ABS, RATIO, YEAR', () => {
    expect(run('ROUND(turnover / 3, 1)')[0]).toBe(333.3);
    expect(run('ABS(0 - turnover)')[0]).toBe(1000);
    expect(run('RATIO(turnover, employees)')).toEqual([100, null, null, 100]);
    expect(run('YEAR(founded)')).toEqual([2015, 2020, 2019, 2010]);
  });
  it('GROWTH and CAGR read the yearly series', () => {
    expect(run('GROWTH(turnover, 1)')[0]).toBe(25);
    expect(run('GROWTH(turnover, 2)')[0]).toBe(100);
    expect(run('GROWTH(turnover, 1)')[1]).toBeNull();
    expect(Math.round((run('CAGR(turnover, 3)')[3] as number) * 100) / 100).toBe(25.99);
  });
});

describe('Excel translation', () => {
  it('turnover / employees becomes a real Excel formula', () => {
    const t = toExcelTemplate('turnover / employees')!;
    expect(t).toBe('IFERROR(({turnover}/{employees}),"")');
    const cols = [{ key: 'name', label: 'Name' }, { key: 'turnover', label: 'Turnover' }, { key: 'employees', label: 'Employees' }];
    expect(formulaToA1(t, cols, 3)).toBe('IFERROR((B3/C3),"")');
  });
  it('aggregates become column ranges', () => {
    const cols = [{ key: 'turnover', label: 'T' }];
    expect(formulaToA1(toExcelTemplate('turnover / SUM(turnover)')!, cols, 5, 102)).toBe('IFERROR((A5/SUM(A$3:A$102)),"")');
  });
  it('IF / ROUND map to Excel functions; GROWTH cannot', () => {
    expect(toExcelTemplate('IF(turnover > 1, ROUND(turnover, 2), 0)')).toBe('IF(({turnover}>1),ROUND({turnover},2),0)');
    expect(toExcelTemplate('GROWTH(turnover, 3)')).toBeNull();
  });
  it('column letters', () => { expect([0, 25, 26, 51, 701].map(colLetter)).toEqual(['A', 'Z', 'AA', 'AZ', 'ZZ']); });
});
