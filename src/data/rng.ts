/** Small deterministic PRNG helpers (mulberry32). */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private r: () => number;
  constructor(seed: number) { this.r = mulberry32(seed); }
  next() { return this.r(); }
  chance(p: number) { return this.r() < p; }
  int(min: number, max: number) { return Math.floor(this.r() * (max - min + 1)) + min; }
  pick<T>(arr: readonly T[]): T { return arr[Math.floor(this.r() * arr.length)]; }
  weighted<T>(entries: readonly (readonly [T, number])[]): T {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let x = this.r() * total;
    for (const [v, w] of entries) { if ((x -= w) <= 0) return v; }
    return entries[entries.length - 1][0];
  }
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(this.r() * copy.length), 1)[0]);
    return out;
  }
  normal() {
    const u = 1 - this.r(), v = this.r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  /** log-normal with given median and sigma */
  logNormal(median: number, sigma: number) { return median * Math.exp(this.normal() * sigma); }
  date(from: Date, to: Date) { return new Date(from.getTime() + this.r() * (to.getTime() - from.getTime())); }
}
