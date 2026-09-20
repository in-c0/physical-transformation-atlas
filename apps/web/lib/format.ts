import type { CheckResult, EvidenceStatus, FrontierClass, KnowledgeLevel, MatrixCellStatus, SearchStatus, StructuralKind } from "@pta/schema";
import { KNOWLEDGE_LEVEL_LABEL } from "@pta/schema";

export const CELL_STATUS_LABEL: Record<MatrixCellStatus, string> = {
  established: "Established",
  demonstrated: "Demonstrated",
  theoretical: "Theoretical",
  candidate: "Candidate composition",
  "searched-none": "Searched · no direct demonstration found",
  "search-incomplete": "Index queried · not reviewed",
  "not-searched": "Not searched",
  forbidden: "Forbidden by known physics",
  contradicted: "Contradicted",
  insufficient: "Insufficient evidence",
};

export const CELL_STATUS_SHORT: Record<MatrixCellStatus, string> = {
  established: "ESTABLISHED",
  demonstrated: "DEMONSTRATED",
  theoretical: "THEORETICAL",
  candidate: "CANDIDATE · NO DIRECT RELATION",
  "searched-none": "SEARCHED · NO DIRECT DEMONSTRATION",
  "search-incomplete": "INDEX QUERIED · NOT REVIEWED",
  "not-searched": "NOT SEARCHED",
  forbidden: "FORBIDDEN BY KNOWN PHYSICS",
  contradicted: "CONTRADICTED",
  insufficient: "INSUFFICIENT EVIDENCE",
};

export const EVIDENCE_LABEL: Record<EvidenceStatus, string> = {
  established: "established",
  replicated: "replicated",
  demonstrated: "demonstrated",
  reported: "reported",
  "theoretically-predicted": "theoretically predicted",
  hypothesised: "hypothesised",
  disputed: "disputed",
  contradicted: "contradicted",
  invalid: "invalid",
};

export const SEARCH_LABEL: Record<SearchStatus, string> = {
  "not-searched": "not searched",
  "search-incomplete": "index queried, not reviewed",
  "searched-no-demonstration-found": "searched · no demonstration found",
  candidate: "candidate",
  "under-review": "under review",
  "experiment-proposed": "experiment proposed",
  "experiment-tested": "experiment tested",
  demonstrated: "demonstrated",
};

export const FRONTIER_LABEL: Record<FrontierClass, string> = {
  demonstrated: "demonstrated",
  candidate: "candidate",
  derived: "extends a recorded pathway",
  weak: "weakly supported",
  forbidden: "fails a check",
  circular: "round trip",
};

/**
 * The four-state language for a composition's search status. Never "none" or "no" for a route
 * nobody has looked for: absence of a search is not absence of a demonstration.
 */
export function compositionState(status: SearchStatus, lastSearched?: string): { short: string; long: string } {
  switch (status) {
    case "demonstrated":
      return { short: "demonstration found", long: "Direct demonstration found." };
    case "searched-no-demonstration-found":
      return { short: "no demonstration found", long: `No direct demonstration found in the recorded search${lastSearched ? ` through ${lastSearched}` : ""}.` };
    case "search-incomplete":
      return { short: "index query only", long: `Not reviewed — index query only${lastSearched ? ` · through ${lastSearched}` : ""}.` };
    case "not-searched":
      return { short: "not assessed", long: "Not assessed — complete composition not searched." };
    default:
      return { short: SEARCH_LABEL[status], long: SEARCH_LABEL[status] };
  }
}

export const OVERLAP_LABEL: Record<"exact" | "prefix" | "suffix" | "subsequence", string> = {
  exact: "same relations",
  prefix: "shares its opening relations with",
  suffix: "shares its closing relations with",
  subsequence: "shares relations, in order, with",
};

export const CHECK_ABBR: Record<CheckResult["id"], string> = {
  "type-chain": "TYPED",
  "energy-form-continuity": "ENERGY",
  conservation: "FREE ENERGY",
  "thermodynamic-bound": "THERMO BOUND",
  dimensional: "DIMENSIONAL",
  "boundary-compatibility": "BOUNDARY",
  "practical-magnitude": "MAGNITUDE",
};
export const CHECK_PHONE: Record<CheckResult["id"], string> = {
  "type-chain": "TYPE",
  "energy-form-continuity": "ENERGY",
  conservation: "FREE",
  "thermodynamic-bound": "BOUND",
  dimensional: "DIM",
  "boundary-compatibility": "BC",
  "practical-magnitude": "MAG",
};
export const CHECK_NAME: Record<CheckResult["id"], string> = {
  "type-chain": "Typed chain",
  "energy-form-continuity": "Energy-form continuity",
  conservation: "Conservation / free energy",
  "thermodynamic-bound": "Thermodynamic bound",
  dimensional: "Dimensional consistency",
  "boundary-compatibility": "Boundary compatibility",
  "practical-magnitude": "Practical magnitude",
};
export const CHECK_GLYPH: Record<CheckResult["result"], string> = { pass: "✓", fail: "×", unresolved: "?", unknown: "—" };

export function kLabel(k: KnowledgeLevel): string {
  return `${k} · ${KNOWLEDGE_LEVEL_LABEL[k]}`;
}

export function pct(x: number, digits = 0): string {
  return (x * 100).toFixed(digits) + "%";
}

export function n(x: number): string {
  return x.toLocaleString("en-AU");
}

/** Page href for a claim id (claim:slug → /claim/slug). */
export const claimHref = (id: string) => `/claim/${id.split(":")[1]}`;
/** Page href for a source id (source:slug → /source/slug). */
export const sourceHref = (id: string) => `/source/${id.split(":")[1]}`;

/** Page href for any entity id. */
export function hrefFor(id: string): string {
  const [type, slug] = id.split(":");
  if (type === "phenomenon") return `/phenomenon/${slug}`;
  return `/e/${type}/${slug}`;
}

export function predicateLabel(p: string): string {
  return p.replace(/_/g, " ");
}

/** The status-transition contract: what record would change a matrix cell. Generated from status, never hand-authored per cell. */
export const CELL_TRANSITION: Record<MatrixCellStatus, string> = {
  established: "This cell would change if the recorded direct relation no longer met the atlas's established or replicated evidence threshold.",
  demonstrated: "An independent replication or review could raise this direct relation to established; contrary evidence could lower its recorded status.",
  theoretical: "A credible experimental observation of this direct relation would move the cell from theoretical evidence to demonstrated evidence.",
  candidate: "A qualifying direct relation would replace the candidate status; otherwise this remains a composition of recorded constituent physics, not a recorded direct relation.",
  "searched-none": "A qualifying direct demonstration, or a newly recorded composition through this coupling, would change this cell.",
  "search-incomplete": "Human review of the recorded search can resolve this to a demonstration found or no direct demonstration found; a qualifying bridge can also make it a candidate composition.",
  "not-searched": "A recorded literature search, direct relation, or qualifying composed bridge would change this cell.",
  forbidden: "This cell would change only if the recorded constraint or source-exergy assessment supporting the exclusion were revised; a search result alone is not sufficient.",
  contradicted: "New or re-reviewed evidence supporting a direct relation could change the recorded status; the current direct claim is contradicted in the atlas.",
  insufficient: "Adding qualifying evidence to the recorded direct claim would determine whether this cell is theoretical, demonstrated, established, or contradicted.",
};

export const STRUCTURE_LABEL: Record<StructuralKind, string> = {
  composition: "composition",
  "known-device-likely": "known device likely",
  "energy-backtracking": "energy backtracking",
  "representation-dominated": "carrier-expanded copy",
  "representation-equivalent": "recorded pathway at another resolution",
  atomic: "one effect plus bookkeeping",
};
