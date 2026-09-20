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
  "energy-backtracking": 2,
  "representation-dominated": 3,
  "representation-equivalent": 4,
  atomic: 5,
};
const SEARCH_RANK: Record<string, number> = { demonstrated: 0, "searched-no-demonstration-found": 1, "search-incomplete": 2, "not-searched": 3, "not-indexed": 3 };
const AVAIL_RANK: Record<string, number> = Object.fromEntries(AVAILABILITY.map((a, i) => [a, i]));
const seamScore = (n: number) => (n === 1 ? 0 : n === 2 ? 1 : n === 0 ? 2 : 3);

export function researchOrder(a: CompiledPath, b: CompiledPath): number {
  const nonEst = (p: CompiledPath) => p.length - p.established_steps;
  return (
    KIND_RANK[a.structural_kind] - KIND_RANK[b.structural_kind] ||
    a.core_unresolved_count - b.core_unresolved_count ||
    EVIDENCE_RANK[b.evidence_status] - EVIDENCE_RANK[a.evidence_status] ||
    nonEst(a) - nonEst(b) ||
    seamScore(a.family_seam_count) - seamScore(b.family_seam_count) ||
    (a.energy_transition_count === 0 ? 1 : 0) - (b.energy_transition_count === 0 ? 1 : 0) ||
    (SEARCH_RANK[a.search_status] ?? 4) - (SEARCH_RANK[b.search_status] ?? 4) ||
    (a.source_availability ? AVAIL_RANK[a.source_availability] : 9) - (b.source_availability ? AVAIL_RANK[b.source_availability] : 9) ||
    a.effective_length - b.effective_length ||
    (a.known_pathway_overlap?.shared_claims ?? 0) - (b.known_pathway_overlap?.shared_claims ?? 0) ||
    a.id.localeCompare(b.id)
  );
}
