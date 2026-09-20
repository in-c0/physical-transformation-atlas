/**
 * Structural classification of enumerated routes. Pure functions over a minimal
 * route shape so they can be unit-tested with synthetic data.
 *
 * Nothing here is an epistemic statement: a route's structural kind says how it
 * sits in the graph (one effect plus bookkeeping? a carrier-expanded copy of a
 * recorded pathway? a genuine handoff between mechanisms?), never how well its
 * physics is known.
 */
import type { EnergyForm, StructuralKind } from "@pta/schema";

export interface RouteCore {
  id: string;
  source: string;
  sinkForm: EnergyForm | undefined;
  /** conversion phenomena in order */
  phenomena: string[];
  /** family sets per phenomenon, same order */
  families: string[][];
  /** energy forms along the route, consecutive repeats collapsed */
  forms: EnergyForm[];
  /** true when the claim sequence is exactly a recorded pathway */
  exact: boolean;
  /** all phenomena share a K6+ transducer through implemented_by / demonstrated_with */
  knownDevice: boolean;
  /** claim ids, so representation collapse can prefer the shortest spelling */
  claimCount?: number;
  /** entity types of the internal nodes (index i = node after step i), for source-preparation */
  internalDisequilibriumAt?: number[];
  /** ids of every enumerated route keyed by its claim-sequence suffixes, supplied by the compiler */
  suffixRouteId?: (fromStep: number) => string | undefined;
}

export function collapseForms(forms: (EnergyForm | undefined)[]): EnergyForm[] {
  const out: EnergyForm[] = [];
  for (const f of forms) {
    if (!f) continue;
    if (out[out.length - 1] !== f) out.push(f);
  }
  return out;
}

export function familySeams(families: string[][]): number {
  let seams = 0;
  for (let i = 1; i < families.length; i++) {
    const a = families[i - 1];
    const b = families[i];
    if (a.length === 0 || b.length === 0) continue; // an unclassified phenomenon is not a seam
    if (!a.some((f) => b.includes(f))) seams++;
  }
  return seams;
}

export function signature(source: string, phenomena: string[], sinkForm: EnergyForm | undefined): string {
  return `${source}|${phenomena.join(">")}|${sinkForm ?? "?"}`;
}

/** A → B → A with no new external driver: a form reappears after a different one. */
export function hasBacktracking(forms: EnergyForm[]): boolean {
  const seen = new Set<EnergyForm>();
  for (let i = 0; i < forms.length; i++) {
    if (seen.has(forms[i]) && forms[i - 1] !== forms[i]) return true;
    seen.add(forms[i]);
  }
  return false;
}

function isOrderedSubsequence(short: string[], long: string[]): boolean {
  let j = 0;
  for (const x of long) if (j < short.length && short[j] === x) j++;
  return j === short.length;
}

/**
 * Classify every route. `namedSignatures` are the mechanism signatures of recorded pathways.
 * Dominance is pairwise within (source, sink form) buckets: B is dominated by A when A's
 * phenomena are a proper ordered subsequence of B's and B's extra phenomena add no seam
 * and no energy transition.
 */
export function classify(routes: RouteCore[], namedSignatures: Set<string>): Map<string, { kind: StructuralKind; semanticOverlap: boolean; dominatedBy: string | null }> {
  const out = new Map<string, { kind: StructuralKind; semanticOverlap: boolean; dominatedBy: string | null }>();
  const buckets = new Map<string, RouteCore[]>();
  for (const r of routes) {
    const k = `${r.source}|${r.sinkForm ?? "?"}`;
    buckets.set(k, [...(buckets.get(k) ?? []), r]);
  }
  for (const r of routes) {
    const sig = signature(r.source, r.phenomena, r.sinkForm);
    const semanticOverlap = !r.exact && namedSignatures.has(sig);
    let kind: StructuralKind;
    let dominatedBy: string | null = null;
    if (r.phenomena.length < 2) kind = "atomic";
    else if (semanticOverlap) kind = "representation-equivalent";
    else {
      const seams = familySeams(r.families);
      const transitions = Math.max(0, r.forms.length - 1);
      const bucket = buckets.get(`${r.source}|${r.sinkForm ?? "?"}`) ?? [];
      for (const a of bucket) {
        if (a.id === r.id || a.phenomena.length >= r.phenomena.length) continue;
        if (!isOrderedSubsequence(a.phenomena, r.phenomena)) continue;
        const aSeams = familySeams(a.families);
        const aTransitions = Math.max(0, a.forms.length - 1);
        if (seams <= aSeams && transitions <= aTransitions) {
          dominatedBy = a.id;
          break;
        }
      }
      if (dominatedBy) kind = "representation-dominated";
      else if (hasBacktracking(r.forms)) kind = "energy-backtracking";
      else if (r.knownDevice) kind = "known-device-likely";
      else kind = "composition";
    }
    // Source preparation (loop-3 pass 10): the route first manufactures a disequilibrium (a
    // temperature gradient by combustion, a Peltier junction, an osmotic pressure by osmosis …) and
    // then runs a suffix that is itself an enumerated route from that disequilibrium. The suffix is
    // the composition; the prefix is a way of supplying its driver.
    if (kind === "composition" && r.internalDisequilibriumAt && r.suffixRouteId) {
      for (const at of r.internalDisequilibriumAt) {
        const suffix = r.suffixRouteId(at);
        if (suffix && suffix !== r.id) {
          kind = "source-preparation";
          dominatedBy = suffix;
          break;
        }
      }
    }
    out.set(r.id, { kind, semanticOverlap, dominatedBy });
  }
  // Phenomena-identical collapse: same source, sink form and ordered phenomena, spelled with a
  // different carrier chain. The shortest claim sequence is the representative.
  const identical = new Map<string, RouteCore[]>();
  for (const r of routes) {
    if (out.get(r.id)!.kind !== "composition") continue;
    const key = signature(r.source, r.phenomena, r.sinkForm);
    identical.set(key, [...(identical.get(key) ?? []), r]);
  }
  for (const group of identical.values()) {
    if (group.length < 2) continue;
    const [rep, ...rest] = [...group].sort((a, b) => (a.claimCount ?? 0) - (b.claimCount ?? 0) || a.id.localeCompare(b.id));
    for (const r of rest) out.set(r.id, { kind: "representation-equivalent", semanticOverlap: false, dominatedBy: rep.id });
  }
  // Family-core collapse (loop-3 pass 10): two compositions with the same source, the same ordered
  // sequence of coupling families and the same sink form are one mechanism spelled with different
  // phenomena (a generator written as "electromagnetic induction" or as "generator action"). One
  // representative stays a composition; the rest become representation-equivalent to it.
  const cores = new Map<string, RouteCore[]>();
  for (const r of routes) {
    if (out.get(r.id)!.kind !== "composition") continue;
    const key = familyCore(r);
    if (!key) continue;
    cores.set(key, [...(cores.get(key) ?? []), r]);
  }
  for (const group of cores.values()) {
    if (group.length < 2) continue;
    const [rep, ...rest] = [...group].sort((a, b) => a.phenomena.length - b.phenomena.length || a.id.localeCompare(b.id));
    for (const r of rest) out.set(r.id, { kind: "representation-equivalent", semanticOverlap: false, dominatedBy: rep.id });
  }
  return out;
}

/** source | ordered family sets | sink form — undefined when any phenomenon has no family (cannot be compared). */
export function familyCore(r: RouteCore): string | undefined {
  if (r.families.some((f) => f.length === 0)) return undefined;
  return `${r.source}|${r.families.map((f) => [...f].sort().join("+")).join(">")}|${r.sinkForm ?? "?"}`;
}
