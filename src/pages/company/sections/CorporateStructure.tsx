import { countryName, flagOf } from '../../../data/countries/iso3166';
import { useMemo, useRef, useState } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SectionProps } from '../CompanyPage';
import type { CorpNode } from '../../../data/profile/types';
import { profilePath } from '../../../lib/nav';
import { Card, KeyValueTable, SectionTitle } from '../ui';
import { countTree } from './Summary';

function find(n: CorpNode, pred: (x: CorpNode) => boolean, parent: CorpNode | null = null): { node: CorpNode; parent: CorpNode | null } | null {
  if (pred(n)) return { node: n, parent };
  for (const ch of n.children) { const r = find(ch, pred, n); if (r) return r; }
  return null;
}
const allIds = (n: CorpNode): string[] => [n.id, ...n.children.flatMap(allIds)];

export function CorporateStructure({ p }: SectionProps) {
  const root = p.corporateTree;
  const cur = find(root, (n) => !!n.current)!;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [legend, setLegend] = useState(true);
  const total = countTree(root);

  const Indented = ({ n, depth }: { n: CorpNode; depth: number }) => (
    <>
      <tr className="border-b border-card-border">
        <td className="py-[7px] pr-2" style={{ paddingLeft: depth * 18 }}>
          <span className="mr-[5px]" aria-label={n.country}>{flagOf(n.country)}</span>
          {n.companyId ? <a href={profilePath(n.companyId)} className="text-primary hover:underline">{n.registeredName}</a> : <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">{n.registeredName}</a>}
          {n.pct != null && <span className="ml-[6px] text-[12px] text-text" data-edge-pct>({n.pct}% held)</span>}
        </td>
        <td className="py-[7px] text-ink">{n.consolidated ? 'Yes' : 'No'}</td>
      </tr>
      {n.children.map((c) => <Indented key={c.id} n={c} depth={depth + 1} />)}
    </>
  );

  return (
    <>
      <SectionTitle>Corporate Structure</SectionTitle>
      <div className="grid grid-cols-2 gap-[16px] items-start">
        <Card title="Summary">
          <KeyValueTable rows={[
            ['Number of companies', total],
            ['Ultimate parent of current company', cur.node === root ? 'This company is the ultimate parent' : root.registeredName],
            ['Parent of current company', cur.parent ? cur.parent.registeredName : '-'],
            ['Children of current company', cur.node.children.length ? `${cur.node.children.length} ${cur.node.children.length === 1 ? 'child' : 'children'}` : '-'],
            ['Is the current company a subsidiary?', cur.parent ? 'Yes' : 'No'],
          ]} />
        </Card>
        <Card title="Corporate Structure">
          <table className="w-full text-[14px]">
            <thead><tr className="border-b border-card-border"><th className="text-left font-semibold text-ink py-[7px]">Company Name</th><th className="text-left font-semibold text-ink py-[7px] w-[160px]">Consolidated Accounts?</th></tr></thead>
            <tbody><Indented n={root} depth={0} /></tbody>
          </table>
        </Card>
      </div>

      <div className="inline-flex border border-primary rounded-btn overflow-hidden divide-x divide-primary my-[16px]">
        {[
          ['Expand Corporate Structure', () => setCollapsed(new Set())],
          ['Collapse Corporate Structure', () => setCollapsed(new Set(allIds(root).filter((id) => id !== root.id)))],
          ['Show/Hide Legend', () => setLegend((v) => !v)],
        ].map(([label, fn]) => (
          <button key={label as string} onClick={fn as () => void} className="h-[30px] px-[13px] text-[14px] font-semibold text-primary bg-white hover:bg-primary-light">{label as string}</button>
        ))}
      </div>

      {legend && (
        <div className="bg-[#DDDDDD] rounded-[3px] px-[16px] py-[10px] flex flex-wrap gap-x-[36px] gap-y-[8px] text-[13px] text-ink mb-[12px]" data-legend>
          <span className="inline-flex items-center gap-[8px]"><svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="#D7263D" /></svg>The current company</span>
          <span className="inline-flex items-center gap-[8px]"><svg width="16" height="16"><circle cx="8" cy="8" r="6" fill="#fff" stroke="#4B4291" strokeWidth="2" /></svg><ChevronDown size={13} /><span>Other companies in group structure<br /><span className="text-text">Tap to expand or collapse subsidiary companies</span></span></span>
          <span className="inline-flex items-center gap-[8px]"><span className="font-semibold">Lumen B…</span><span>Registered name of company<br /><span className="text-text">Hover for full registered name, ID, and country. Tap to open company page in new tab</span></span></span>
        </div>
      )}

      <TreeDiagram root={root} collapsed={collapsed} toggle={(id) => setCollapsed((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
    </>
  );
}

function TreeDiagram({ root, collapsed, toggle }: { root: CorpNode; collapsed: Set<string>; toggle: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  const layout = useMemo(() => {
    const h = hierarchy(root, (d) => (collapsed.has(d.id) ? null : d.children));
    tree<CorpNode>().nodeSize([150, 110])(h);
    const nodes = h.descendants();
    const xs = nodes.map((n) => n.x!);
    const minX = Math.min(...xs), maxX = Math.max(...xs), maxY = Math.max(...nodes.map((n) => n.y!));
    const width = Math.max(maxX - minX + 240, 1100);
    return { h, nodes, links: h.links(), offX: width / 2 - (minX + maxX) / 2, width, height: maxY + 120 };
  }, [root, collapsed]);

  return (
    <div
      ref={box}
      className="bg-surface border border-card-border rounded-card overflow-auto nb-scroll cursor-grab active:cursor-grabbing select-none"
      style={{ height: 420 }}
      data-tour="corp-tree"
      onPointerDown={(e) => { if ((e.target as Element).closest('[data-node]')) return; drag.current = { x: e.clientX, y: e.clientY, sl: box.current!.scrollLeft, st: box.current!.scrollTop }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (!drag.current) return; box.current!.scrollLeft = drag.current.sl - (e.clientX - drag.current.x); box.current!.scrollTop = drag.current.st - (e.clientY - drag.current.y); }}
      onPointerUp={() => { drag.current = null; }}
    >
      <svg width={layout.width} height={layout.height} role="group" aria-label="Corporate structure diagram">
        <g transform={`translate(${layout.offX} 50)`}>
          {layout.links.map((l) => (
            <g key={l.target.data.id}>
              <path d={`M${l.source.x},${l.source.y! + 12} V${(l.source.y! + l.target.y!) / 2 + 10} H${l.target.x} V${l.target.y! - 24}`} fill="none" stroke="#BDBDBD" />
              {l.target.data.pct != null && <text x={l.target.x! + 4} y={(l.source.y! + l.target.y!) / 2 + 24} fontSize={11} fill="#4B4291" fontWeight={600} fontFamily="Public Sans">{l.target.data.pct}%</text>}
            </g>
          ))}
          {layout.nodes.map((n) => {
            const d = n.data;
            const isCur = !!d.current;
            const hasKids = d.children.length > 0;
            const open = !collapsed.has(d.id);
            const label = d.name.length > 12 ? `${d.name.slice(0, 10)}…` : d.name;
            return (
              <g key={d.id} transform={`translate(${n.x} ${n.y})`} data-node>
                <title>{`${d.registeredName}\nCountry: ${d.country}${d.companyId ? '\nClick the name to open the company page' : ''}`}</title>
                <text y={-18} textAnchor="middle" fontSize={13} fontWeight={600} fill="#282828" fontFamily="Public Sans" className={d.companyId ? 'cursor-pointer hover:underline' : ''} onClick={() => d.companyId && window.open(profilePath(d.companyId), '_blank')}>{flagOf(d.country)} {label}</text>
                <circle r={10} fill={isCur ? '#D7263D' : '#fff'} stroke={isCur ? '#D7263D' : '#4B4291'} strokeWidth={2} className={hasKids ? 'cursor-pointer' : ''} onClick={() => hasKids && toggle(d.id)} data-node-circle={d.id} />
                {hasKids && (
                  <g transform="translate(-7 14)" className="cursor-pointer" role="button" tabIndex={0} onClick={() => toggle(d.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(d.id)} aria-label={`${open ? 'Collapse' : 'Expand'} ${d.name}`}>
                    {open ? <ChevronUp size={14} color={isCur ? '#8A2020' : '#4B4291'} strokeWidth={3} /> : <ChevronDown size={14} color={isCur ? '#8A2020' : '#4B4291'} strokeWidth={3} />}
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
