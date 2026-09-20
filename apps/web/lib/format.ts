import type { CheckResult, EvidenceStatus, FrontierClass, KnowledgeLevel, MatrixCellStatus, PathwayStatus, SearchStatus, StructuralKind } from "@pta/schema";
import { KNOWLEDGE_LEVEL_LABEL } from "@pta/schema";

export const CELL_STATUS_LABEL: Record<MatrixCellStatus, string> = {
  established: "Established",
  demonstrated: "Demonstrated",
  theoretical: "Theoretical",
  candidate: "Candidate composition",
  "searched-none": "Searched · no direct demonstration found",
  "search-incomplete": "Search incomplete · not decided",
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
  "search-incomplete": "SEARCH INCOMPLETE · NOT DECIDED",
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
  "search-incomplete": "search incomplete, not decided",
  "searched-no-demonstration-found": "searched · no demonstration found",
  candidate: "candidate",
  "under-review": "under review",
  "experiment-proposed": "experiment proposed",
  "experiment-tested": "experiment tested",
  demonstrated: "demonstrated",
};

/** Pathway statuses as shown on routes, claims and the frontier; observed never reads as a demonstration. */
export const PATHWAY_STATUS_LABEL: Record<PathwayStatus, string> = {
  demonstrated: "demonstrated",
  prototype: "prototype",
  commercial: "commercial",
  proposed: "proposed in the literature, not demonstrated",
  observed: "observed · output not delivered",
};

export const FRONTIER_LABEL: Record<FrontierClass, string> = {
  demonstrated: "demonstrated",
  candidate: "candidate",
  derived: "extends a recorded pathway",
  "incomplete-handoff": "unresolved handoff",
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
      return { short: `${lastSearched ? `reviewed ${lastSearched} · ` : ""}demonstration found`, long: "A recorded pathway or a reviewed search records a demonstration of this composition." };
    case "searched-no-demonstration-found":
      return {
        short: `reviewed${lastSearched ? ` ${lastSearched}` : ""} · no demonstration found`,
        long: `Reviewed search${lastSearched ? ` on ${lastSearched}` : ""}: no qualifying demonstration found in the recorded protocol. This is search provenance, not evidence that the composition is absent from nature.`,
      };
    case "search-incomplete":
      return {
        short: "search incomplete",
        long: `Search incomplete${lastSearched ? ` through ${lastSearched}` : ""} — a record exists (an automated index run, or a reviewed search that is partial or blocked) but no reviewed result decides it.`,
      };
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
  conservation: "AVAILABILITY",
  "thermodynamic-bound": "THERMO BOUND",
  dimensional: "DIMENSIONAL",
  "boundary-compatibility": "BOUNDARY",
  "practical-magnitude": "COVERAGE",
};
export const CHECK_PHONE: Record<CheckResult["id"], string> = {
  "type-chain": "TYPE",
  "energy-form-continuity": "ENERGY",
  conservation: "AVAIL",
  "thermodynamic-bound": "BOUND",
  dimensional: "DIM",
  "boundary-compatibility": "BC",
  "practical-magnitude": "COV",
};
export const CHECK_NAME: Record<CheckResult["id"], string> = {
  "type-chain": "Typed chain",
  "energy-form-continuity": "Energy-form continuity",
  conservation: "Source work availability",
  "thermodynamic-bound": "Thermodynamic bound",
  dimensional: "Dimensional consistency",
  "boundary-compatibility": "Boundary compatibility",
  "practical-magnitude": "Measured performance coverage",
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

/** The predicate as a verb phrase inside a sentence: "a temperature gradient drives the Seebeck effect". */
export const PREDICATE_PROSE: Record<string, string> = {
  drives: "drives",
  produces: "produces",
  couples_to: "couples directly into",
  converts_into: "is delivered as",
  mediated_by: "is mediated by",
  member_of: "belongs to",
  implemented_by: "is implemented by",
  requires: "requires",
  inhibited_by: "is inhibited by",
  enhanced_by: "is enhanced by",
  bounded_by: "is bounded by",
  conserves: "conserves",
  dissipates_to: "dissipates to",
  observed_in: "has been observed in",
  predicted_in: "is predicted in",
  demonstrated_with: "has been demonstrated with",
  governed_by: "is governed by",
};

/** One self-contained sentence stating what the atlas asserts with a claim. */
export function claimSentence(
  status: EvidenceStatus,
  subject: { name: string; type: string },
  predicate: string,
  object: { name: string; type: string },
  hasConditions: boolean,
  isProper: (word: string) => boolean,
): string {
  // Lowercase a name's first letter unless its first word is a proper noun (Seebeck effect, Onsager reciprocity).
  const plain = (n: string) => (isProper(n.split(/\s/)[0]) || /^[A-Z]{2,}/.test(n) ? n : n[0].toLowerCase() + n.slice(1));
  const plural = (n: string) => /[^s]s$/.test(n.split(/\s/).pop() ?? "") && !/ss$/.test(n);
  const indefinite = (n: string) => (plural(n) ? plain(n) : `${/^[aeiou]/i.test(plain(n)) ? "an" : "a"} ${plain(n)}`);
  const definite = (n: string) => `the ${plain(n)}`;
  // Phenomena named as a thing take "the" (the Seebeck effect, the streaming potential); process nouns do not (radioactive decay produces …).
  const thing = /effect|potential|cycle|lift|descent|action|expansion|convection|conduction|emission|pressure|transport|drag|instability|force/i;
  const phen = (n: string) => (thing.test(n) ? definite(n) : plain(n));
  const subj = ["disequilibrium", "carrier"].includes(subject.type) ? indefinite(subject.name) : subject.type === "phenomenon" ? phen(subject.name) : definite(subject.name);
  const obj =
    predicate === "member_of"
      ? `the ${plain(object.name)} coupling family`
      : object.type === "phenomenon"
        ? phen(object.name)
        : object.type === "output"
          ? plain(object.name)
          : ["constraint", "coupling", "interaction", "quantity"].includes(object.type)
            ? definite(object.name)
            : indefinite(object.name);
  const verb = PREDICATE_PROSE[predicate] ?? predicateLabel(predicate);
  // Plural subjects (alpha particles, charge carriers) take the plural verb form.
  const agreed =
    plural(subject.name) && ["disequilibrium", "carrier"].includes(subject.type)
      ? verb
          .replace(/^(drives|produces|couples|conserves|dissipates|requires)/, (v) => v.slice(0, -1))
          .replace(/^is /, "are ")
          .replace(/^has /, "have ")
          .replace(/^belongs /, "belong ")
      : verb;
  return `The atlas records this claim as ${EVIDENCE_LABEL[status].toLowerCase()}: ${subj} ${agreed} ${obj}${hasConditions ? " under the conditions below" : ""}.`;
}

/** The status-transition contract: what record would change a matrix cell. Generated from status, never hand-authored per cell. */
export const CELL_TRANSITION: Record<MatrixCellStatus, string> = {
  established: "This cell would change if the recorded direct relation no longer met the atlas's established or replicated evidence threshold.",
  demonstrated:
    "If a direct claim is recorded: an independent replication or review could raise it to established, contrary evidence could lower it. If the status comes from a reviewed search alone: recording the demonstrated relation as a canonical claim is the pending step.",
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
  "representation-equivalent": "same mechanism at another resolution",
  "source-preparation": "prepares an ambient driver for a recorded composition",
  atomic: "one effect plus bookkeeping",
};
