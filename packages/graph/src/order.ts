/**
 * The research-priority order for compositions, shared by the frontier and the matrix
 * drawer so that "which composition should I look at first" has one answer everywhere.
 *
 * Lexicographic: structure → resolution of the four core checks → evidence floor → number of
 * non-established constituents → mechanism novelty (one or two seams first) → at least one
 * energy-form transition → composition-search strength → source availability → effective
 * length → overlap with recorded pathways → id. Never a synthetic score.
 */
import { AVAILABILITY, EVIDENCE_RANK, type CompiledPath, type StructuralKind } from "@pta/schema";

export const KIND_RANK: Record<StructuralKind, number> = {
  composition: 0,
  "known-device-likely": 1,
  "source-preparation": 2,
  "energy-backtracking": 3,
  "representation-dominated": 4,
  "representation-equivalent": 5,
  atomic: 6,
};
const MAGNITUDE_RANK: Record<string, number> = { quantified: 0, bounded: 1, missing: 2, incompatible: 3 };
/** Fraction of the route's effects that some recorded device already implements: novelty runs the other way. */
const deviceCoverage = (p: CompiledPath) => p.device_coverage.implemented / Math.max(1, p.device_coverage.of);
const SEARCH_RANK: Record<string, number> = { demonstrated: 0, "searched-no-demonstration-found": 1, "search-incomplete": 2, "not-searched": 3 };
const AVAIL_RANK: Record<string, number> = Object.fromEntries(AVAILABILITY.map((a, i) => [a, i]));
const seamScore = (n: number) => (n === 1 ? 0 : n === 2 ? 1 : n === 0 ? 2 : 3);

/**
 * Lexicographic (loop-3 pass 10): structure → core checks unresolved → carrier handoffs unresolved →
 * how much of the route a recorded device already implements → magnitude screen → search state →
 * evidence floor → non-established constituents → driver availability → seams → energy transitions →
 * effective length → id. Never a synthetic score.
 */
export function researchOrder(a: CompiledPath, b: CompiledPath): number {
  const nonEst = (p: CompiledPath) => p.length - p.established_steps;
  return (
    KIND_RANK[a.structural_kind] - KIND_RANK[b.structural_kind] ||
    a.core_unresolved_count - b.core_unresolved_count ||
    a.handoff_unresolved_count - b.handoff_unresolved_count ||
    deviceCoverage(a) - deviceCoverage(b) ||
    MAGNITUDE_RANK[a.magnitude_screen.status] - MAGNITUDE_RANK[b.magnitude_screen.status] ||
    (SEARCH_RANK[a.search_status] ?? 4) - (SEARCH_RANK[b.search_status] ?? 4) ||
    EVIDENCE_RANK[b.evidence_status] - EVIDENCE_RANK[a.evidence_status] ||
    nonEst(a) - nonEst(b) ||
    (a.source_availability ? AVAIL_RANK[a.source_availability] : 9) - (b.source_availability ? AVAIL_RANK[b.source_availability] : 9) ||
    seamScore(a.family_seam_count) - seamScore(b.family_seam_count) ||
    (a.energy_transition_count === 0 ? 1 : 0) - (b.energy_transition_count === 0 ? 1 : 0) ||
    a.effective_length - b.effective_length ||
    a.id.localeCompare(b.id)
  );
}
