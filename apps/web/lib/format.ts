import type { CheckResult, EvidenceStatus, FrontierClass, KnowledgeLevel, MatrixCellStatus, SearchStatus } from "@pta/schema";
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
  "not-indexed": "not indexed",
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
  weak: "weakly supported",
  forbidden: "fails a check",
  circular: "round trip",
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

/** Page href for any entity id. */
export function hrefFor(id: string): string {
  const [type, slug] = id.split(":");
  if (type === "phenomenon") return `/phenomenon/${slug}`;
  return `/e/${type}/${slug}`;
}

export function predicateLabel(p: string): string {
  return p.replace(/_/g, " ");
}
