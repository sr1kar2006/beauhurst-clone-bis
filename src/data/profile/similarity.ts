import { getCompanies, getCompany } from '../dataset';
import type { Company } from '../types';

const STOP = new Set(['the', 'and', 'for', 'that', 'with', 'helps', 'their', 'develops', 'its', 'through', 'from', 'this', 'are', 'our', 'into']);
const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

let index: { vecs: Map<string, Map<string, number>>; norms: Map<string, number> } | null = null;

/** TF-IDF vectors over every company description (built once, lazily). */
function buildIndex() {
  const docs = getCompanies();
  const df = new Map<string, number>();
  const tfs = docs.map((c) => {
    const tf = new Map<string, number>();
    tokens(c.description.replace(c.name, '')).forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    tf.forEach((_, t) => df.set(t, (df.get(t) ?? 0) + 1));
    return tf;
  });
  const N = docs.length;
  const vecs = new Map<string, Map<string, number>>();
  const norms = new Map<string, number>();
  docs.forEach((c, i) => {
    const v = new Map<string, number>();
    let norm = 0;
    tfs[i].forEach((tf, t) => {
      const w = tf * Math.log(N / (1 + df.get(t)!));
      v.set(t, w);
      norm += w * w;
    });
    vecs.set(c.id, v);
    norms.set(c.id, Math.sqrt(norm) || 1);
  });
  return { vecs, norms };
}

const cache = new Map<string, string[]>();

/** 20 most similar companies: 60% description cosine + 40% industry Jaccard. */
export function similarIds(id: string, n = 20): string[] {
  if (cache.has(id)) return cache.get(id)!;
  const self = getCompany(id);
  if (!self) return [];
  index ??= buildIndex();
  const a = index.vecs.get(id) ?? new Map<string, number>();
  const an = index.norms.get(id) ?? 1;
  const ind = new Set(self.industries);
  const scored: [Company, number][] = [];
  for (const c of getCompanies()) {
    if (c.id === id) continue;
    const b = index.vecs.get(c.id)!;
    let dot = 0;
    a.forEach((w, t) => { const x = b.get(t); if (x) dot += w * x; });
    const cos = dot / (an * index.norms.get(c.id)!);
    const inter = c.industries.filter((x) => ind.has(x)).length;
    const jac = inter / (ind.size + c.industries.length - inter || 1);
    scored.push([c, 0.6 * cos + 0.4 * jac]);
  }
  scored.sort((x, y) => y[1] - x[1]);
  const out = scored.slice(0, n).map(([c]) => c.id);
  cache.set(id, out);
  return out;
}
