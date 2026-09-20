/**
 * @pta/schema — the typed shape of everything in `data/canonical`.
 *
 * Nothing in the atlas is a raw graph edge. The graph is derived from claims,
 * and every claim carries its conditions, evidence and review status.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export const ENTITY_TYPES = [
  "system",
  "quantity",
  "disequilibrium",
  "state",
  "interaction",
  "phenomenon",
  "transition",
  "carrier",
  "coupling",
  "transducer",
  "material",
  "constraint",
  "output",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const PREDICATES = [
  "drives", // disequilibrium | carrier → phenomenon
  "produces", // phenomenon → carrier | disequilibrium
  "couples_to", // phenomenon → phenomenon (direct coupling of two effects)
  "converts_into", // phenomenon | carrier → output
  "mediated_by", // phenomenon → carrier (descriptive, not a process step)
  "member_of", // phenomenon → coupling (family)
  "implemented_by", // coupling | phenomenon → transducer
  "requires", // any → material | constraint | state | interaction
  "inhibited_by", // any → phenomenon | constraint
  "enhanced_by", // any → phenomenon | material
  "bounded_by", // phenomenon | coupling | transducer → constraint
  "conserves", // phenomenon → quantity
  "dissipates_to", // phenomenon | coupling → output (heat) | carrier
  "observed_in", // phenomenon → material | system
  "predicted_in", // phenomenon → material | system
  "demonstrated_with", // phenomenon | coupling → transducer
  "governed_by", // phenomenon → interaction
] as const;
export type Predicate = (typeof PREDICATES)[number];

/** Predicates that carry energy from one process node to the next. */
export const PROCESS_PREDICATES = ["drives", "produces", "couples_to", "converts_into"] as const;
export type ProcessPredicate = (typeof PROCESS_PREDICATES)[number];

export const EVIDENCE_STATUSES = [
  "established",
  "replicated",
  "demonstrated",
  "reported",
  "theoretically-predicted",
  "hypothesised",
  "disputed",
  "contradicted",
  "invalid",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

/** Rank used when a path takes the weakest of its constituent claims. */
export const EVIDENCE_RANK: Record<EvidenceStatus, number> = {
  established: 8,
  replicated: 7,
  demonstrated: 6,
  reported: 5,
  "theoretically-predicted": 4,
  hypothesised: 3,
  disputed: 2,
  contradicted: 1,
  invalid: 0,
};

export const SEARCH_STATUSES = [
  "not-searched",
  "search-incomplete",
  "searched-no-demonstration-found",
  "candidate",
  "under-review",
  "experiment-proposed",
  "experiment-tested",
  "demonstrated",
] as const;
export type SearchStatus = (typeof SEARCH_STATUSES)[number];

export const KNOWLEDGE_LEVELS = ["K0", "K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8"] as const;
export type KnowledgeLevel = (typeof KNOWLEDGE_LEVELS)[number];
export const KNOWLEDGE_LEVEL_LABEL: Record<KnowledgeLevel, string> = {
  K0: "known physical quantity",
  K1: "known interaction",
  K2: "known transition",
  K3: "theoretically quantified",
  K4: "experimentally observed",
  K5: "energy harvested",
  K6: "working transducer",
  K7: "engineering prototype",
  K8: "commercial technology",
};

export const ENERGY_FORMS = [
  "thermal",
  "mechanical",
  "electrical",
  "magnetic",
  "chemical",
  "radiative",
  "nuclear",
  "gravitational",
  "acoustic",
  "spin",
  "phonon",
  "electronic-excitation",
  "kinetic",
  "surface",
  "osmotic",
] as const;
export type EnergyForm = (typeof ENERGY_FORMS)[number];

export const DOMAINS = [
  "thermodynamics",
  "classical-mechanics",
  "electromagnetism",
  "electrochemistry",
  "condensed-matter",
  "fluid-mechanics",
  "optics-photonics",
  "spin-systems",
  "nuclear-physics",
  "plasma-physics",
  "quantum-transport",
  "biophysical-transduction",
  "surface-interface",
  "chemistry",
] as const;
export type Domain = (typeof DOMAINS)[number];

export const AVAILABILITY = ["ambient-common", "ambient-conditional", "engineered-common", "stored-controlled", "scarce-specialised"] as const;
export type Availability = (typeof AVAILABILITY)[number];

/**
 * Structural kind of an enumerated route — a statement about graph structure, never about
 * evidence. composition = two or more conversion phenomena with a real handoff; the others are
 * artefacts of representation that stay searchable but are not frontier material.
 */
export const STRUCTURAL_KINDS = ["composition", "known-device-likely", "energy-backtracking", "representation-dominated", "representation-equivalent", "atomic"] as const;
export type StructuralKind = (typeof STRUCTURAL_KINDS)[number];

export const MATRIX_CELL_STATUSES = [
  "established", // canonical direct relation, established or replicated
  "demonstrated", // direct relation with a demonstration or report indexed
  "theoretical", // direct relation supported theoretically only
  "candidate", // no direct relation; a composed bridge exists with every constituent established
  "searched-none", // a reviewed search found no qualifying direct demonstration
  "search-incomplete", // only an automated index query has run; not reviewed
  "not-searched", // no recorded search at all
  "forbidden", // excluded by a recorded physical constraint under the stated conditions
  "contradicted", // a direct relation whose claim is disputed or contradicted
  "insufficient", // a direct relation exists but carries no evidence
] as const;
export type MatrixCellStatus = (typeof MATRIX_CELL_STATUSES)[number];

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const EntityId = z
  .string()
  .regex(new RegExp(`^(${ENTITY_TYPES.join("|")}):[a-z0-9]+(?:-[a-z0-9]+)*$`), "entity id must be <type>:<slug>");
export const ClaimId = z.string().regex(/^claim:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const SourceId = z.string().regex(/^source:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const PathwayId = z.string().regex(/^pathway:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const SearchId = z.string().regex(/^search:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const Slug = z.string().regex(slug);

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

// ---------------------------------------------------------------------------
// Ontology support files
// ---------------------------------------------------------------------------

/** SI dimension vector: mass, length, time, current, temperature, amount, luminous intensity. */
export const Dimension = z.object({
  M: z.number().default(0),
  L: z.number().default(0),
  T: z.number().default(0),
  I: z.number().default(0),
  Th: z.number().default(0),
  N: z.number().default(0),
  J: z.number().default(0),
});
export type Dimension = z.infer<typeof Dimension>;

export const UnitDef = z.object({
  symbol: z.string(),
  name: z.string(),
  dimension: Dimension,
});
export type UnitDef = z.infer<typeof UnitDef>;

export const DomainDef = z.object({
  id: z.enum(DOMAINS),
  name: z.string(),
  /** How many distinct, well-established phenomena a thorough V1 in this domain would carry. */
  target_phenomena: z.number().int().positive(),
  summary: z.string(),
});
export type DomainDef = z.infer<typeof DomainDef>;

export const ConditionConflict = z.object({
  a: Slug,
  b: Slug,
  reason: z.string(),
});
export type ConditionConflict = z.infer<typeof ConditionConflict>;

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

/**
 * Review provenance on a canonical record. `last_reviewed` is null unless a person (or a logged
 * review pass) actually re-read the record on that date; the schema never manufactures a date.
 */
export const ReviewMeta = z.object({
  canonical: z.boolean().default(true),
  last_reviewed: isoDate.nullable().default(null),
  reviewer: z.string().optional(),
});
export type ReviewMeta = z.infer<typeof ReviewMeta>;

export const Entity = z.object({
  id: EntityId,
  type: z.enum(ENTITY_TYPES),
  name: z.string().min(1),
  symbol: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  domain: z.enum(DOMAINS).optional(),
  summary: z.string().min(1),
  /** For quantities: the SI dimension. */
  dimension: Dimension.optional(),
  /** For quantities: the customary SI unit symbol. */
  unit: z.string().optional(),
  /** For disequilibria: the quantity whose difference drives change. */
  quantity: EntityId.optional(),
  /** For carriers and outputs: the form of energy carried. */
  energy_form: z.enum(ENERGY_FORMS).optional(),
  /** For disequilibria: whether exergy is available relative to a reference environment. */
  exergy: z.enum(["positive", "conditional", "none"]).optional(),
  /** For disequilibria: how readily the driver is found. Curated per row; a late ranking key on the frontier. */
  availability: z.enum(AVAILABILITY).optional(),
  /** For constraints: the bound in words and, if it has one, as a formula. */
  bound: z.string().optional(),
  /** For constraints: a numeric efficiency ceiling when one exists independent of conditions. */
  max_efficiency: z.number().min(0).max(1).optional(),
  /** For constraints: the numeric ceiling only applies to paths starting at one of these disequilibria. */
  applies_to_sources: z.array(EntityId).default([]),
  /** Typical condition tags (env:*, state:*, temp:*, field:*), used by the boundary check. */
  condition_tags: z.array(Slug).default([]),
  /** For transducers: readiness of the real device. */
  knowledge_level: z.enum(KNOWLEDGE_LEVELS).optional(),
  year_first_reported: z.number().int().optional(),
  wikidata: z.string().optional(),
  tags: z.array(Slug).default([]),
  review: ReviewMeta.default({ canonical: true, last_reviewed: null }),
});
export type Entity = z.infer<typeof Entity>;

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const Source = z.object({
  id: SourceId,
  type: z.enum(["paper", "review", "book", "database", "standard", "patent", "thesis", "report", "web"]),
  title: z.string().min(1),
  authors: z.array(z.string()).default([]),
  year: z.number().int().optional(),
  venue: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  review: ReviewMeta.default({ canonical: true, last_reviewed: null }),
});
export type Source = z.infer<typeof Source>;

// ---------------------------------------------------------------------------
// Claims
// ---------------------------------------------------------------------------

export const Relation = z.object({
  /** Human-readable constitutive relation, e.g. "ΔV = S · ΔT". */
  formula: z.string(),
  /** Quantity on the input side. */
  input: EntityId,
  /** Quantity on the output side. */
  output: EntityId,
  /** Unit of the coefficient linking them, e.g. "V/K". Used by the dimensional check. */
  coefficient_unit: z.string(),
  coefficient_name: z.string().optional(),
  /** How the quantities and the sign are defined, when the formula alone does not say. */
  conventions: z.string().optional(),
});
export type Relation = z.infer<typeof Relation>;

export const Claim = z.object({
  id: ClaimId,
  subject: EntityId,
  predicate: z.enum(PREDICATES),
  object: EntityId,
  /** Plain-language conditions under which the relation holds. */
  conditions: z.array(z.string()).default([]),
  /** Machine-checkable condition tags (see ontology/condition-tags.yaml). */
  condition_tags: z.array(Slug).default([]),
  /** Energy bookkeeping for process claims. */
  energy: z
    .object({
      input: z.enum(ENERGY_FORMS),
      output: z.enum(ENERGY_FORMS),
      /** Where the rest goes. */
      dissipation: z.enum(ENERGY_FORMS).optional(),
    })
    .optional(),
  relation: Relation.optional(),
  evidence: z.array(SourceId).default([]),
  status: z.enum(EVIDENCE_STATUSES),
  /** Where the physics sits on the K-scale, if the claim is a phenomenon-level claim. */
  knowledge_level: z.enum(KNOWLEDGE_LEVELS).optional(),
  review: ReviewMeta.default({ canonical: true, last_reviewed: null }),
  notes: z.string().optional(),
});
export type Claim = z.infer<typeof Claim>;

// ---------------------------------------------------------------------------
// Pathways (named, reviewed compositions)
// ---------------------------------------------------------------------------

export const Measurement = z.object({
  quantity: z.string(), // e.g. "module efficiency", "power density", "open-circuit voltage"
  value: z.string(), // keep as written in the source, e.g. "12%", "1.2 W/cm²", "≈ 6 µV/K"
  scope: z.enum(["material", "device", "module", "system", "plant", "laboratory", "field", "model"]),
  conditions: z.string(), // regime: temperatures, load, irradiance, geometry
  sources: z.array(SourceId).min(1),
  year: z.number().int().optional(),
  note: z.string().optional(),
});
export type Measurement = z.infer<typeof Measurement>;

export const Pathway = z.object({
  id: PathwayId,
  name: z.string(),
  /** Ordered process claims, first subject must be a disequilibrium, last object an output. */
  steps: z.array(ClaimId).min(1),
  demonstrated_with: z.array(EntityId).default([]),
  evidence: z.array(SourceId).default([]),
  status: z.enum(["demonstrated", "prototype", "commercial", "proposed"]),
  knowledge_level: z.enum(KNOWLEDGE_LEVELS),
  performance: z
    .object({
      efficiency_typical: z.number().min(0).max(1).optional(),
      efficiency_record: z.number().min(0).max(1).optional(),
      theoretical_limit: z.string().optional(),
      power_density: z.string().optional(),
      notes: z.string().optional(),
      /** Auditable data: one record per number, with what was measured, under what regime, and where. */
      measurements: z.array(Measurement).default([]),
    })
    .optional(),
  environment: z.array(Slug).default([]),
  summary: z.string(),
  review: ReviewMeta.default({ canonical: true, last_reviewed: null }),
});
export type Pathway = z.infer<typeof Pathway>;

// ---------------------------------------------------------------------------
// Search records — the only thing allowed to say "no demonstration found"
// ---------------------------------------------------------------------------

export const SearchTarget = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("cell"), row: EntityId, col: EntityId }),
  z.object({ kind: z.literal("path"), path: z.string() }),
  z.object({ kind: z.literal("claim"), claim: ClaimId }),
]);

export const SearchRecord = z.object({
  id: SearchId,
  target: SearchTarget,
  date: isoDate,
  engine: z.enum(["openalex", "crossref", "manual", "google-scholar", "semantic-scholar"]),
  query: z.string(),
  works_found: z.number().int().nonnegative(),
  top: z
    .array(z.object({ title: z.string(), year: z.number().int().optional(), doi: z.string().optional(), url: z.string().optional() }))
    .default([]),
  result: z.enum(["demonstration-found", "no-demonstration-found", "inconclusive"]),
  reviewed_by: z.string().optional(),
  notes: z.string().optional(),
  /** Set by the compiler: true when the record lives in data/canonical/searches (human-reviewed). */
  reviewed: z.boolean().optional(),
});
export type SearchRecord = z.infer<typeof SearchRecord>;

// ---------------------------------------------------------------------------
// Compiled graph (what the site loads)
// ---------------------------------------------------------------------------

export const CheckResult = z.object({
  id: z.enum(["type-chain", "energy-form-continuity", "conservation", "thermodynamic-bound", "dimensional", "boundary-compatibility", "practical-magnitude"]),
  label: z.string(),
  result: z.enum(["pass", "fail", "unresolved", "unknown"]),
  detail: z.string(),
});
export type CheckResult = z.infer<typeof CheckResult>;

export const FRONTIER_CLASSES = ["demonstrated", "candidate", "derived", "weak", "forbidden", "circular"] as const;
export type FrontierClass = (typeof FRONTIER_CLASSES)[number];

export const CompiledPath = z.object({
  id: z.string(),
  nodes: z.array(EntityId),
  claims: z.array(ClaimId),
  source: EntityId,
  sink: EntityId,
  length: z.number().int(),
  evidence_status: z.enum(EVIDENCE_STATUSES),
  established_steps: z.number().int(),
  search_status: z.enum(SEARCH_STATUSES),
  /** demonstrated · candidate (all constituents at least demonstrated, no fail, no recorded-pathway overlap) · derived (candidate that extends or truncates a recorded pathway) · weak (a constituent is theoretical or worse) · forbidden (a check fails) · circular (source and sink share an energy form) */
  frontier_class: z.enum(FRONTIER_CLASSES),
  knowledge_level: z.enum(KNOWLEDGE_LEVELS),
  pathway: PathwayId.optional(),
  checks: z.array(CheckResult),
  coupling_families: z.array(EntityId),
  domains: z.array(z.enum(DOMAINS)),
  last_searched: isoDate.optional(),
  literature: z.object({ supporting: z.number().int(), contradictory: z.number().int() }),
  /** Sources cited by the constituent claims (never evidence for the composition itself). */
  constituent_source_ids: z.array(SourceId),
  /** Sources cited for the complete composition (named pathway evidence, reviewed search hits). */
  composition_source_ids: z.array(SourceId),
  /** Lowest knowledge level among the constituent claims; says nothing about the composition. */
  constituent_floor: z.enum(KNOWLEDGE_LEVELS),
  /** Conversion phenomena on the route, in order. */
  phenomena: z.array(EntityId),
  /** Number of conversion phenomena; carriers and the terminal output projection do not count. */
  effective_length: z.number().int(),
  /** Energy forms along the route with consecutive repeats collapsed. */
  energy_form_sequence: z.array(z.enum(ENERGY_FORMS)),
  energy_transition_count: z.number().int(),
  /** Adjacent phenomena whose coupling-family sets are disjoint: a real mechanism handoff. */
  family_seam_count: z.number().int(),
  /** Unresolved or unknown results among energy continuity, conservation, thermodynamic bound, boundary. */
  core_unresolved_count: z.number().int(),
  /** Adjacent-step condition conflicts: an exchanger, window, membrane or shaft is implied but not recorded. */
  implied_interface_count: z.number().int(),
  /** Conversion steps that carry a constitutive relation, over all conversion steps. */
  magnitude_data_coverage: z.object({ quantified: z.number().int(), of: z.number().int() }),
  /** source | ordered phenomena | sink energy form — the mechanism core, independent of carriers. */
  representation_signature: z.string(),
  /** A recorded pathway with the same mechanism core but a different claim sequence, if any. */
  semantic_overlap: PathwayId.nullable(),
  structural_kind: z.enum(STRUCTURAL_KINDS),
  /** If representation-dominated: the shorter route with the same mechanism core. */
  dominated_by: z.string().nullable(),
  source_availability: z.enum(AVAILABILITY).nullable(),
  /** The recorded pathway this route most overlaps, if any. exact = same claim sequence. */
  known_pathway_overlap: z
    .object({
      pathway: PathwayId,
      relation: z.enum(["exact", "prefix", "suffix", "subsequence"]),
      shared_claims: z.number().int(),
      route_claims: z.number().int(),
    })
    .nullable(),
});
export type CompiledPath = z.infer<typeof CompiledPath>;

export const MatrixCell = z.object({
  row: EntityId,
  col: EntityId,
  status: z.enum(MATRIX_CELL_STATUSES),
  direct_claims: z.array(ClaimId),
  direct_phenomena: z.array(EntityId),
  bridge_paths: z.array(z.string()),
  /** row/col addresses, e.g. D.04 and C.11 — stable dataset addresses */
  address: z.string(),
  searched: z.boolean(),
  last_searched: isoDate.optional(),
  works_found: z.number().int().optional(),
});
export type MatrixCell = z.infer<typeof MatrixCell>;

export const CoverageEntry = z.object({
  domain: z.enum(DOMAINS),
  name: z.string(),
  phenomena: z.number().int(),
  target_phenomena: z.number().int(),
  claims: z.number().int(),
  claims_with_evidence: z.number().int(),
  ontology_coverage: z.number().min(0).max(1),
  literature_coverage: z.number().min(0).max(1),
  unresolved_claims: z.number().int(),
});
export type CoverageEntry = z.infer<typeof CoverageEntry>;

export type MatrixAxis = { id: EntityId; address: string; name: string; family: string };

export type Graph = {
  meta: {
    version: string;
    built_at: string;
    data_hash: string;
    /** Git commit of the canonical files the build read, when the build ran inside the repository. */
    source_commit: string | null;
    /** Latest date any search record (reviewed or automated) covers; null when none exists. */
    search_indexed_through: string | null;
    counts: {
      entities: number;
      phenomena: number;
      disequilibria: number;
      couplings: number;
      transducers: number;
      claims: number;
      sources: number;
      pathways_named: number;
      paths_examined: number;
      paths_demonstrated: number;
      paths_no_demonstration_found: number;
      paths_not_searched: number;
      matrix_cells: number;
      matrix_cells_empty: number;
      matrix_cells_unsearched: number;
      coverage_mean: number;
      /** Occurrence maps: which vocabulary values this revision actually uses, and how often. */
      claims_by_status: Record<string, number>;
      claims_by_predicate: Record<string, number>;
      paths_by_search_status: Record<string, number>;
      paths_by_frontier_class: Record<string, number>;
      paths_by_structural_kind: Record<string, number>;
      matrix_cells_by_status: Record<string, number>;
      entities_by_type: Record<string, number>;
    };
  };
  entities: Entity[];
  claims: Claim[];
  sources: Source[];
  pathways: Pathway[];
  searches: SearchRecord[];
  paths: CompiledPath[];
  matrix: { rows: MatrixAxis[]; cols: MatrixAxis[]; cells: MatrixCell[] };
  coverage: CoverageEntry[];
  source_verification: Record<string, { verified: boolean; checked_at: string; crossref_title?: string; note?: string }>;
};

export type EntityId = z.infer<typeof EntityId>;
