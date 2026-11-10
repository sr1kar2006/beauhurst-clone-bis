import { KeyboardEvent, useMemo, useRef, useState } from 'react';
import { Plus, Sigma } from 'lucide-react';
import { FIELDS, FIELD_IDS } from './fields';
import { FUNCTIONS } from '../formula/parse';
import { validate } from '../formula/evaluate';

/** Formula bar with field/function autocomplete and inline validation errors. */
export function FormulaBar({ onAdd, extraFields = [] }: { onAdd: (label: string, formula: string) => void; extraFields?: string[] }) {
  const [label, setLabel] = useState('');
  const [formula, setFormula] = useState('');
  const [active, setActive] = useState(0);
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const fields = useMemo(() => new Set([...FIELD_IDS, ...extraFields]), [extraFields]);
  const error = formula.trim() ? validate(formula, fields) : null;

  // the identifier being typed at the caret
  const caret = ref.current?.selectionStart ?? formula.length;
  const m = /[A-Za-z_][A-Za-z0-9_]*$/.exec(formula.slice(0, caret));
  const word = m?.[0] ?? '';
  const suggestions = useMemo(() => {
    if (!word) return [];
    const w = word.toLowerCase();
    return [
      ...FUNCTIONS.filter((f) => f.toLowerCase().startsWith(w)).map((f) => ({ insert: `${f}(`, label: `${f}( )`, hint: 'function' })),
      ...FIELDS.filter((f) => f.kind !== 'text' && (f.id.toLowerCase().startsWith(w) || f.label.toLowerCase().includes(w))).map((f) => ({ insert: f.id, label: f.id, hint: f.label })),
    ].slice(0, 8);
  }, [word]);

  const accept = (s: { insert: string }) => {
    const before = formula.slice(0, caret - word.length), after = formula.slice(caret);
    const next = before + s.insert + after;
    setFormula(next);
    requestAnimationFrame(() => { const pos = (before + s.insert).length; ref.current?.setSelectionRange(pos, pos); ref.current?.focus(); });
  };
  const onKey = (e: KeyboardEvent) => {
    if (!suggestions.length || !focus) { if (e.key === 'Enter') submit(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); accept(suggestions[active] ?? suggestions[0]); }
  };
  const submit = () => {
    if (!formula.trim() || error) return;
    onAdd(label.trim() || formula.trim(), formula.trim());
    setLabel(''); setFormula('');
  };

  return (
    <div className="flex items-start gap-[8px] text-[14px]" data-formula-bar>
      <Sigma size={18} className="mt-[7px] text-primary shrink-0" aria-hidden />
      <label className="sr-only" htmlFor="calc-label">Column name</label>
      <input id="calc-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Column name" className="w-[180px] h-[32px] border border-border rounded-btn px-[8px]" data-calc-label />
      <div className="relative flex-1">
        <label className="sr-only" htmlFor="calc-formula">Formula</label>
        <input
          id="calc-formula"
          ref={ref}
          role="combobox"
          aria-expanded={!!suggestions.length && focus}
          aria-controls="formula-suggestions"
          aria-invalid={!!error}
          aria-describedby={error ? 'formula-error' : 'formula-help'}
          value={formula}
          onChange={(e) => { setFormula(e.target.value); setActive(0); }}
          onKeyDown={onKey}
          onFocus={() => setFocus(true)}
          onBlur={() => setTimeout(() => setFocus(false), 150)}
          placeholder="e.g. turnover / employees   or   GROWTH(turnover, 3)"
          spellCheck={false}
          className={`w-full h-[32px] border rounded-btn px-[8px] font-mono text-[13px] ${error ? 'border-[#C0392B]' : 'border-border focus:border-primary'} focus:outline-none`}
          data-calc-formula
        />
        {focus && suggestions.length > 0 && (
          <ul id="formula-suggestions" role="listbox" className="absolute z-30 left-0 top-[34px] w-[360px] bg-white border border-border rounded-card shadow-lg py-[4px]">
            {suggestions.map((s, i) => (
              <li key={s.insert} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); accept(s); }} className={`flex items-center justify-between px-[10px] py-[4px] cursor-pointer ${i === active ? 'bg-primary-light' : ''}`}>
                <span className="font-mono text-[13px] text-ink">{s.label}</span><span className="text-[12px] text-muted">{s.hint}</span>
              </li>
            ))}
          </ul>
        )}
        {error ? (
          <p id="formula-error" role="alert" className="text-[12px] text-[#C0392B] mt-[3px]" data-formula-error>
            {error.message}{formula ? <> at position {error.pos + 1}: <code className="bg-[#FDE2E1] px-[3px]">{formula.slice(error.pos, error.pos + 12) || '(end)'}</code></> : null}
          </p>
        ) : (
          <p id="formula-help" className="text-[12px] text-muted mt-[3px]">Fields, + − × ÷ ( ), and SUM AVG MEDIAN MIN MAX COUNT IF ROUND ABS GROWTH CAGR RATIO YEAR. Press Tab to complete.</p>
        )}
      </div>
      <button onClick={submit} disabled={!formula.trim() || !!error} className="inline-flex items-center gap-[5px] h-[32px] px-[12px] rounded-btn bg-primary text-white text-[14px] font-semibold disabled:opacity-40" data-calc-add>
        <Plus size={15} />Add column
      </button>
    </div>
  );
}
