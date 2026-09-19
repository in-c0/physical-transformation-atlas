/**
 * Dimensional analysis over SI base dimensions.
 *
 * A dimension is a vector of exponents over (M, L, T, I, Θ, N, J). Units are
 * looked up from a table the ontology supplies (data/canonical/ontology/units.yaml)
 * so that a claim's constitutive relation — say ΔV = S · ΔT with S in V/K — can be
 * checked: dim(output) must equal dim(coefficient) + dim(input).
 */
import type { Dimension, UnitDef } from "@pta/schema";

export const DIM_KEYS = ["M", "L", "T", "I", "Th", "N", "J"] as const;
export type DimKey = (typeof DIM_KEYS)[number];

export const ZERO: Dimension = { M: 0, L: 0, T: 0, I: 0, Th: 0, N: 0, J: 0 };

export function dim(partial: Partial<Dimension>): Dimension {
  return { ...ZERO, ...partial };
}

export function add(a: Dimension, b: Dimension): Dimension {
  const out = { ...ZERO };
  for (const k of DIM_KEYS) out[k] = a[k] + b[k];
  return out;
}

export function sub(a: Dimension, b: Dimension): Dimension {
  const out = { ...ZERO };
  for (const k of DIM_KEYS) out[k] = a[k] - b[k];
  return out;
}

export function scale(a: Dimension, n: number): Dimension {
  const out = { ...ZERO };
  for (const k of DIM_KEYS) out[k] = a[k] * n;
  return out;
}

export function equal(a: Dimension, b: Dimension): boolean {
  return DIM_KEYS.every((k) => Math.abs(a[k] - b[k]) < 1e-9);
}

export function isDimensionless(a: Dimension): boolean {
  return equal(a, ZERO);
}

const PRETTY: Record<DimKey, string> = { M: "M", L: "L", T: "T", I: "I", Th: "Θ", N: "N", J: "J" };

export function format(a: Dimension): string {
  const parts: string[] = [];
  for (const k of DIM_KEYS) {
    const e = a[k];
    if (e === 0) continue;
    parts.push(e === 1 ? PRETTY[k] : `${PRETTY[k]}^${Number.isInteger(e) ? e : e.toFixed(2)}`);
  }
  return parts.length ? parts.join("·") : "1";
}

export class UnitTable {
  private units = new Map<string, Dimension>();

  constructor(defs: UnitDef[]) {
    for (const u of defs) this.units.set(u.symbol, dim(u.dimension));
  }

  has(symbol: string): boolean {
    return this.units.has(symbol);
  }

  /**
   * Parse a compound unit such as "V/K", "C/N", "m^2/(V·s)", "W/(m·K)", "1", "A/W".
   * Grammar: term ("·" | "*" | " ") term ... ["/" term ...]; term := symbol ["^" int].
   * Only one "/" is allowed; everything after it is the denominator.
   */
  parse(expr: string): Dimension {
    const cleaned = expr.replace(/\s+/g, " ").trim();
    if (cleaned === "" || cleaned === "1" || cleaned === "-") return { ...ZERO };
    const slash = cleaned.indexOf("/");
    const num = slash === -1 ? cleaned : cleaned.slice(0, slash);
    const den = slash === -1 ? "" : cleaned.slice(slash + 1);
    return sub(this.parseProduct(num), this.parseProduct(den));
  }

  private parseProduct(s: string): Dimension {
    let acc = { ...ZERO };
    const body = s.replace(/^\(|\)$/g, "").trim();
    if (body === "" || body === "1") return acc;
    for (const raw of body.split(/[·*\s]+/)) {
      if (!raw) continue;
      const m = raw.match(/^([A-Za-zΩ°µ]+)(?:\^(-?\d+(?:\.\d+)?))?$/);
      if (!m) throw new Error(`cannot parse unit term "${raw}" in "${s}"`);
      const [, sym, exp] = m;
      const d = this.units.get(sym);
      if (!d) throw new Error(`unknown unit symbol "${sym}"`);
      acc = add(acc, scale(d, exp ? Number(exp) : 1));
    }
    return acc;
  }
}
