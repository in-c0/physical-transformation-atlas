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

export const EVIDENCE_STATUSES = ["established", "replicated", "demonstrated", "reported", "theoretically-predicted", "hypothesised", "disputed", "contradicted", "invalid"] as const;
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

/** loop-3 pass 19: the kinds of recorded limit and the quantities they bound. */
export const CONSTRAINT_KINDS = ["upper-bound", "formula-bound", "resource-bound", "constitutive-relation", "benchmark"] as const;
export const BOUND_METRICS = [
  "conversion-efficiency",
  "conversion-efficiency-at-maximum-power",
  "power-coefficient",
  "power-density",
  "current-density",
  "work-per-volume",
  "work",
  "pressure",
  "mechanical-power-density",
  "converted-fraction-per-cycle",
  "reciprocity",
] as const;

export const AVAILABILITY = ["ambient-common", "ambient-conditional", "engineered-common", "stored-controlled", "scarce-specialised"] as const;
export type Availability = (typeof AVAILABILITY)[number];

/**
 * Structural kind of an enumerated route — a statement about graph structure, never about
 * evidence. composition = two or more conversion phenomena with a real handoff; the others are
 * artefacts of representation that stay searchable but are not frontier material.
 */
export const STRUCTURAL_KINDS = ["composition", "known-device-likely", "source-preparation", "energy-backtracking", "representation-dominated", "representation-equivalent", "atomic"] as const;
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
export const EntityId = z.string().regex(new RegExp(`^(${ENTITY_TYPES.join("|")}):[a-z0-9]+(?:-[a-z0-9]+)*$`), "entity id must be <type>:<slug>");
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
  summary: z.string(),
  /** How the inventory was assembled; editorial and revisable. */
  target_basis: z.string(),
  /** The checklist of phenomenon slugs a thorough first broad release would carry: recorded ones plus the missing ones. */
  target_inventory: z.array(Slug).min(1),
  /** Derived by the loader: target_inventory.length. Never typed by hand. */
  target_phenomena: z.number().int().positive().optional(),
});
export type DomainDef = z.infer<typeof DomainDef>;

export const ConditionConflict = z.object({
  a: Slug,
  b: Slug,
  reason: z.string(),
});
export type ConditionConflict = z.infer<typeof ConditionConflict>;

/**
 * Scoped conditions (loop-3 pass 26). A condition tag on a claim applies in a scope — medium (the matter
 * the phenomenon acts in), boundary (a surface, contact or gap the step crosses or uses) or environment
 * (a surrounding field, atmosphere, vacuum or source) — and on a named region of the device (active by
 * default; hot-side, cold-side, upstream, downstream, gap, electrode, membrane, ambient are the usual
 * others). Two requirements can only conflict in the same scope on the same region; an adjacent-step
 * conflict on the same continuing region is an interface the route must record.
 */
export const CONDITION_SCOPES = ["medium", "boundary", "environment"] as const;
export type ConditionScope = (typeof CONDITION_SCOPES)[number];
export const ConditionRequirement = z.object({ tag: Slug, scope: z.enum(CONDITION_SCOPES), region: Slug.default("active") });
export type ConditionRequirement = z.infer<typeof ConditionRequirement>;
/** Tags of which at most one may describe the same region in the same scope (material state; coarse temperature regime). */
export const ExclusiveGroup = z.object({ id: Slug, members: z.array(Slug).min(2), scope: z.enum(CONDITION_SCOPES), rule: z.string() });
export type ExclusiveGroup = z.infer<typeof ExclusiveGroup>;

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
  /**
   * For constraints (loop-3 pass 19): what kind of limit this is. Only upper-bound and formula-bound
   * are "hard" bounds the thermodynamic-bound check may pass or fail a route on; a benchmark
   * (Curzon–Ahlborn), a constitutive relation (Onsager–Casimir) or a resource bound without a
   * comparable datum is listed as a recorded limit and never decides.
   */
  constraint_kind: z.enum(CONSTRAINT_KINDS).optional(),
  /** For constraints: which quantity the limit bounds; a datum is comparable only when its metric matches. */
  metric: z.enum(BOUND_METRICS).optional(),
  /** For formula bounds: the ceiling as a formula over formula_inputs, evaluated by the check when a datum records every input. */
  formula: z.string().optional(),
  formula_inputs: z.array(z.string()).default([]),
  /** For upper bounds: a numeric ceiling that holds whenever the applicability filters do. */
  max_efficiency: z.number().min(0).max(1).optional(),
  /** For formula bounds: the ceiling at a stated reference regime, for display only (e.g. Landsberg 0.933 at 6000 K / 300 K). */
  reference_value: z.number().optional(),
  reference_regime: z.string().optional(),
  /** For upper bounds: the measurement basis a datum must state to be compared (e.g. "single-junction, unconcentrated AM1.5G"). */
  requires_basis: z.string().optional(),
  /** Applicability filters: an empty list means no further filter, never that every route shares the bound. */
  applies_to_sources: z.array(EntityId).default([]),
  applies_to_outputs: z.array(EntityId).default([]),
  applies_to_phenomena: z.array(EntityId).default([]),
  /** Typical condition tags (env:*, state:*, temp:*, field:*), used by the boundary check. */
  condition_tags: z.array(Slug).default([]),
  /**
   * Regime tokens a disequilibrium supplies to the steps it drives (pass 30): a temperature gradient
   * supplies "thermal:spatial-temperature-gradient", not "thermal:temporal-temperature-change". A token
   * in regime_excludes is one the source cannot supply, so a step requiring it fails rather than waits.
   */
  regime_provides: z.array(z.string()).default([]),
  regime_excludes: z.array(z.string()).default([]),
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
  type: z.enum(["paper", "preprint", "review", "book", "database", "standard", "patent", "thesis", "report", "web"]),
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
  /** Machine-checkable condition tags (see ontology/condition-tags.yaml); the flat form, scope and region defaulted. */
  condition_tags: z.array(Slug).default([]),
  /**
   * The scoped form (pass 26): authoritative for the boundary check when present; when empty the
   * compiler expands condition_tags with each tag's default scope on region "active". Entity-level
   * tags describe the entity and are never inherited into a route step.
   */
  condition_requirements: z.array(ConditionRequirement).default([]),
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
  /**
   * Whether this step is expected to carry a constitutive relation (loop-3 pass 19). Defaults by
   * predicate: drives / couples_to are conversion steps ("unknown" until a reviewer says required or
   * not-applicable); produces / converts_into are bookkeeping ("not-applicable"). The dimensional
   * check passes a route only when every required or unknown conversion step carries a balanced relation.
   */
  relation_requirement: z.enum(["required", "not-applicable", "unknown"]).optional(),
  /**
   * What a producing step hands to the next step and what a consuming step needs from the previous
   * one, as short tokens ("flow:bulk", "surface:charged"). The compiler compares them across each
   * carrier handoff: every requirement provided = compatible; a requirement nothing provides =
   * unresolved (the atlas has not recorded enough to compose that interface — never "impossible").
   */
  handoff: z
    .object({
      provides: z.array(z.string()).default([]),
      requires_all: z.array(z.string()).default([]),
      requires_any: z.array(z.string()).default([]),
    })
    .optional(),
  /**
   * Driver / regime sufficiency (loop-3 pass 30). A drives or couples_to step may require a regime of
   * its causal source that a syntactically valid edge does not guarantee — pyroelectricity needs a
   * temperature that changes in time, which a static gradient does not supply. regime_requires lists
   * such tokens ("thermal:temporal-temperature-change"); regime_provides lists tokens a step's output
   * supplies to later steps; regime_external lists tokens the step's own stated conditions supply from
   * outside the route (a stack held above Swift's critical gradient). Providers are never inferred from
   * aliases or prose: only the route source's regime_provides, a preceding step's regime_provides (or
   * that of the disequilibrium it produces), and the step's own regime_external count.
   */
  regime_requires: z.array(z.string()).default([]),
  regime_provides: z.array(z.string()).default([]),
  regime_external: z.array(z.string()).default([]),
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
  /** Structured form of the datum (loop-3 pass 19): the number, its unit, which bounded quantity it is, the basis it is defined on, and the parameters a formula bound needs (T_h_K, T_c_K, ZT, T_s_K …). */
  value_numeric: z.number().optional(),
  unit: z.string().optional(),
  metric: z.enum(BOUND_METRICS).optional(),
  basis: z.string().optional(),
  parameters: z.record(z.string(), z.number()).optional(),
  scope: z.enum(["material", "device", "module", "system", "plant", "laboratory", "field", "model"]),
  conditions: z.string(), // regime: temperatures, load, irradiance, geometry
  sources: z.array(SourceId).min(1),
  year: z.number().int().optional(),
  note: z.string().optional(),
});
export type Measurement = z.infer<typeof Measurement>;

/**
 * Pathway statuses. demonstrated / prototype / commercial are demonstrations of the composition and
 * make the exact route demonstrated; proposed (a design or simulation in the literature) and observed
 * (loop-3 pass 24: one physical experiment traversed every conversion phenomenon and handoff in order
 * but the route's terminal output criterion was not met — a polarization, current, force or flow was
 * measured, no work delivered) are attached to their route but never make it demonstrated and are
 * ignored when other routes are classified as derived.
 */
export const PATHWAY_STATUSES = ["demonstrated", "prototype", "commercial", "proposed", "observed"] as const;
export type PathwayStatus = (typeof PATHWAY_STATUSES)[number];
export const DEMONSTRATED_PATHWAY_STATUSES = ["demonstrated", "prototype", "commercial"] as const;
export const isDemonstratedPathway = (p: { status: PathwayStatus }): boolean => (DEMONSTRATED_PATHWAY_STATUSES as readonly string[]).includes(p.status);

const PathwayBase = z.object({
  id: PathwayId,
  name: z.string(),
  /** Ordered process claims, first subject must be a disequilibrium, last object an output. */
  steps: z.array(ClaimId).min(1),
  demonstrated_with: z.array(EntityId).default([]),
  evidence: z.array(SourceId).default([]),
  status: z.enum(PATHWAY_STATUSES),
  /**
   * Required iff status is observed: the last route claim the pathway's evidence physically
   * established, so an observed pathway never silently implies that every listed step was shown.
   * Must be one of the steps and not the final one (a final step established would be a demonstration).
   */
  observed_through: ClaimId.optional(),
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
/**
 * An interface record (loop-3 pass 26): a physical surface, contact, wall, window, membrane, coupling or
 * free surface between two regions of a device, recorded either between two adjacent claims (the handoff
 * it carries) or within one claim (a boundary internal to a conversion step, such as an MHD channel's
 * electrodes). A demonstrated record resolves the adjacent-step region transition it names; a
 * theoretical or proposed one is shown but leaves the boundary check unresolved.
 */
export const INTERFACE_KINDS = [
  "gas-solid-acoustic-boundary",
  "fluid-solid-mechanical-boundary",
  "electrode-contact",
  "heat-exchanger-wall",
  "radiative-window",
  "membrane",
  "shaft-coupling",
  "free-surface",
  "material-contact",
] as const;
export type InterfaceKind = (typeof INTERFACE_KINDS)[number];
export const INTERFACE_STATUSES = ["demonstrated", "theoretical", "proposed"] as const;
export type InterfaceStatus = (typeof INTERFACE_STATUSES)[number];
export const InterfaceId = z.string().regex(/^interface:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const InterfaceLocation = z.union([
  z.object({ between_claims: z.object({ from_claim: ClaimId, to_claim: ClaimId }) }).strict(),
  z.object({ within_claim: ClaimId }).strict(),
]);
export type InterfaceLocation = z.infer<typeof InterfaceLocation>;
export const Interface = z.object({
  id: InterfaceId,
  location: InterfaceLocation,
  kind: z.enum(INTERFACE_KINDS),
  from_region: Slug,
  to_region: Slug,
  /** The carrier that crosses, if one does. */
  carrier: EntityId.nullable().default(null),
  /** The handoff token the crossing preserves, if the consuming step requires one. */
  handoff_token: z.string().nullable().default(null),
  /** An optional transmission relation in the atlas's relation form (input and output the same quantity, a dimensionless coefficient). */
  relation: Relation.nullable().default(null),
  conditions: z.array(z.string()).default([]),
  condition_requirements: z.array(ConditionRequirement).default([]),
  evidence: z.array(SourceId).default([]),
  status: z.enum(INTERFACE_STATUSES),
  notes: z.string().nullable().default(null),
  review: ReviewMeta.default({ canonical: true, last_reviewed: null }),
});
export type Interface = z.infer<typeof Interface>;
/** A route's view of one interface record. */
export const InterfaceRef = z.object({ interface: InterfaceId, kind: z.enum(INTERFACE_KINDS), status: z.enum(INTERFACE_STATUSES), location: z.string() });
export type InterfaceRef = z.infer<typeof InterfaceRef>;

export const Pathway = PathwayBase.superRefine((p, ctx) => {
  if (p.status === "observed") {
    if (!p.observed_through) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["observed_through"], message: "an observed pathway must name observed_through, the last step its evidence physically established" });
    else if (!p.steps.includes(p.observed_through)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["observed_through"], message: "observed_through must be one of the pathway's steps" });
    else if (p.observed_through === p.steps[p.steps.length - 1]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["observed_through"], message: "observed_through cannot be the final step: a final step established is a demonstration, not an observation" });
  } else if (p.observed_through) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["observed_through"], message: "observed_through is only recorded on a pathway with status observed" });
  }
});
export type Pathway = z.infer<typeof Pathway>;

// ---------------------------------------------------------------------------
// Search records — the only thing allowed to say "no demonstration found"
// ---------------------------------------------------------------------------

export const SearchTarget = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("cell"), row: EntityId, col: EntityId }),
  /** claims: the route's ordered claim ids, so the loader can derive its mechanisms and check the id (required for route-search-v1). */
  z.object({ kind: z.literal("path"), path: z.string(), claims: z.array(ClaimId).optional() }),
  z.object({ kind: z.literal("claim"), claim: ClaimId }),
]);

const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?([+-]\d{2}:\d{2}|Z))?$/, "ISO 8601 date or date-time");

export const SEARCH_ENGINES = ["openalex", "semantic-scholar", "google-scholar", "crossref", "manual"] as const;
/** Cell forms (cell-search-v1) and route forms (route-search-v1); citation-chase serves both. */
export const QUERY_FORMS = [
  "driver-family",
  "driver-phenomenon",
  "demonstration-precision",
  "citation-chase",
  "route-driver-mechanism",
  "route-mechanism-pair",
  "route-whole-chain",
  "route-demonstration-precision",
  /** route-search-v1 (loop-3 pass 27): the field's own names for the composition, OR-ed, with no constituent vocabulary required. */
  "route-composite-name",
] as const;

/**
 * A composition term (pass 27): an established literature name for a multi-step composition, frozen on a
 * route plan or record only when a recorded source uses it for a process or device spanning at least two of
 * the target route's concepts. Route vocabulary, never an alias of a constituent entity; when any is frozen,
 * the composite-name form becomes mandatory on every engine before a protocol-complete negative.
 */
export const CompositionTerm = z.object({ term: z.string().min(1), evidence: z.array(SourceId).min(1), broad: z.boolean().optional() });
export type CompositionTerm = z.infer<typeof CompositionTerm>;
/**
 * route-only: a real experiment, but the driver reaches the family through a separately resolvable
 * intermediate conversion — evidence for a route, not for a direct cell relation. The four route
 * decisions (route-search-v1): constituent-only = one mechanism or one adjacent pair demonstrated, not
 * the whole composition; source-variant = the ordered mechanisms and output demonstrated from a
 * different causal driver; sink-variant = driver and mechanisms match but the demonstrated output
 * differs; longer-chain = the experiment needs an extra conversion phenomenon between two steps the
 * target records as consecutive (evidence for that longer route, not this one).
 */
export const HIT_DECISIONS = [
  "qualifies",
  "route-only",
  "constituent-only",
  "source-variant",
  "sink-variant",
  "longer-chain",
  "theory-only",
  "simulation-only",
  "proposal-only",
  "review-only",
  "wrong-driver",
  "wrong-coupling",
  "driver-only-modifies",
  "duplicate",
  "insufficient-information",
] as const;

/** One query submitted to one engine: the literal syntax, when, how many came back and how many were looked at. */
export const SearchRun = z.object({
  id: z.string(),
  engine: z.enum(SEARCH_ENGINES),
  query_form: z.enum(QUERY_FORMS),
  /** route-search-v1: which required query this run is — driver-mechanism:1, mechanism-pair:i-(i+1), whole-chain, demonstration-precision — so the gate can check coverage, not just form names. */
  query_key: z.string().optional(),
  /** The literal syntax actually submitted; never reconstructed later from aliases. */
  query: z.string(),
  /** route-search-v1 Google Scholar query-length exception (loop-3 pass 22): true when the submitted string is a compaction of the frozen bundles; expanded_query holds the unabridged form it stands for. */
  query_compacted: z.boolean().optional(),
  expanded_query: z.string().optional(),
  /** Scholar throttling and continuation (loop-3 pass 23): a mandatory run screened over several sittings carries a segment number, the result positions this segment screened and why it stopped. */
  segment: z.number().int().positive().optional(),
  positions_screened: z.string().optional(),
  interruption: z.string().optional(),
  executed_at: isoDateTime,
  /** The request URL with any private mailto removed. */
  request_url: z.string().optional(),
  engine_version: z.string().nullable().optional(),
  index_snapshot: z.string().nullable().optional(),
  sort: z.string().optional(),
  filters: z.record(z.string(), z.union([z.string(), z.array(z.string()), z.number(), z.null()])).optional(),
  result_count_reported: z.number().int().nullable(),
  records_retrieved: z.number().int().nonnegative(),
  records_screened: z.number().int().nonnegative(),
  records_read: z.number().int().nonnegative(),
});
export type SearchRun = z.infer<typeof SearchRun>;

/** One record a reviewer looked at, with the decision and the reason. */
export const ReviewedHit = z.object({
  title: z.string(),
  year: z.number().int().optional(),
  doi: z.string().optional(),
  url: z.string().optional(),
  external_ids: z.record(z.string(), z.string()).optional(),
  found_by: z.array(z.string()).default([]),
  access: z.enum(["full-text", "abstract", "metadata-only"]),
  decision: z.enum(HIT_DECISIONS),
  reason: z.string(),
});
export type ReviewedHit = z.infer<typeof ReviewedHit>;

/**
 * A reviewed literature search: a review package, not one query. Only a record with
 * completeness protocol-complete-negative, a reviewer, every mandatory query form and discovery
 * engine completed and no qualifying hit may say no-demonstration-found; the loader enforces it.
 * A positive may stop early: one unambiguous qualifying experiment, read, is conclusive.
 */
export const SearchRecord = z.object({
  id: SearchId,
  target: SearchTarget,
  protocol_version: z.string(),
  started_at: isoDateTime,
  completed_at: isoDateTime,
  objective: z.enum(["direct-relation", "exact-composition", "claim-verification"]),
  /** Frozen composition terms (route-search-v1 composite-name form, pass 27); empty when the field has no such name. */
  composition_terms: z.array(CompositionTerm).default([]),
  inclusion_criteria: z.array(z.string()).min(1),
  exclusion_criteria: z.array(z.string()).min(1),
  runs: z.array(SearchRun).min(1),
  screening: z.object({
    records_retrieved: z.number().int().nonnegative(),
    unique_records: z.number().int().nonnegative(),
    title_abstract_screened: z.number().int().nonnegative(),
    full_text_read: z.number().int().nonnegative(),
  }),
  hits: z.array(ReviewedHit).default([]),
  result: z.enum(["demonstration-found", "no-demonstration-found", "inconclusive"]),
  completeness: z.enum(["conclusive-positive", "protocol-complete-negative", "partial", "blocked"]),
  reviewed_by: z.string().min(1),
  reviewed_on: isoDate,
  limitations: z.array(z.string()).default([]),
  conclusion: z.string(),
  /** Automated runs (data/generated/search-runs.json) whose frozen result lists the reviewer screened. */
  source_run_ids: z.array(z.string()).default([]),
  /** For demonstration-found: whether the hit has been turned into canonical ontology yet. */
  follow_up: z
    .object({
      canonical_claim_review: z.enum(["needed", "completed", "not-applicable"]),
      /** For a positive route search: whether a person has written the Pathway record (the compiler never does). */
      canonical_pathway_review: z.enum(["needed", "completed", "not-applicable"]).optional(),
      candidate_source_ids: z.array(SourceId).default([]),
      candidate_claim: z.object({ subject: EntityId, predicate: z.literal("drives"), object: EntityId }).optional(),
    })
    .optional(),
  /** Set by the compiler: true when the record lives in data/canonical/searches (human-reviewed). */
  reviewed: z.boolean().optional(),
});
export type SearchRecord = z.infer<typeof SearchRecord>;

/** The date a search record speaks for: the day it was completed. */
export const searchDate = (s: { completed_at: string }) => s.completed_at.slice(0, 10);

/**
 * An automated index run (data/generated/search-runs.json): a frozen result list a person can later
 * screen and promote to a SearchRecord without re-running the query. Never a reviewed statement.
 */
export const AutomatedSearchRun = z.object({
  id: z.string(),
  target: SearchTarget,
  dataset_hash: z.string(),
  driver_terms: z.array(z.string()),
  family_terms: z.array(z.string()),
  phenomenon_terms: z.record(z.string(), z.array(z.string())).default({}),
  composition_terms: z.array(CompositionTerm).default([]),
  runs: z.array(SearchRun).min(1),
  works: z
    .array(
      z.object({
        openalex_id: z.string().optional(),
        doi: z.string().optional(),
        title: z.string(),
        year: z.number().int().optional(),
        type: z.string().optional(),
        cited_by_count: z.number().int().optional(),
        open_access_url: z.string().optional(),
        found_by: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  screening_status: z.literal("not-reviewed"),
  result: z.literal("inconclusive"),
  notes: z.string().optional(),
});
export type AutomatedSearchRun = z.infer<typeof AutomatedSearchRun>;

// ---------------------------------------------------------------------------
// Compiled graph (what the site loads)
// ---------------------------------------------------------------------------

export const CheckResult = z.object({
  id: z.enum(["type-chain", "energy-form-continuity", "conservation", "thermodynamic-bound", "dimensional", "boundary-compatibility", "driver-regime-sufficiency", "practical-magnitude"]),
  label: z.string(),
  result: z.enum(["pass", "fail", "unresolved", "unknown"]),
  detail: z.string(),
});
export type CheckResult = z.infer<typeof CheckResult>;

export const FRONTIER_CLASSES = ["demonstrated", "candidate", "derived", "incomplete-handoff", "weak", "forbidden", "circular"] as const;
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
  /** The unrecorded ones, "claim → claim: tag vs tag", so the row can say which interface is implied; a recorded interface (of any status) is listed under interfaces_recorded instead. */
  implied_interfaces: z.array(z.string()),
  /** Interface records on the route (pass 26): between two of its adjacent steps, or within one of its steps. */
  interfaces_recorded: z.array(InterfaceRef),
  /** Recorded interfaces that carry a transmission relation, over all recorded; outside the magnitude screen by design. */
  interface_model_coverage: z.object({ with_relation: z.number().int(), of: z.number().int() }),
  /** The step whose evidence status is the route's weakest; ties resolve to the earliest step. */
  weakest_claim: ClaimId,
  /** The recorded device (transducer) that shares the most steps with this route, if any step is implemented by one. */
  closest_known_device: z.object({ transducer: EntityId, shared_steps: z.number().int(), of: z.number().int() }).nullable(),
  /** Conversion phenomena on the route that some recorded device implements, over all of them. */
  device_coverage: z.object({ implemented: z.number().int(), of: z.number().int() }),
  /**
   * The recorded pathway whose mechanism this route most resembles, by longest common subsequence
   * of phenomena (then of claims). source-variant = the pathway's phenomena are a suffix of the
   * route's (the route prepares the driver differently); sink-variant = a prefix (the route ends
   * differently); mechanism-subsequence = two or more phenomena in order.
   */
  closest_known_pathway: z
    .object({
      pathway: PathwayId,
      relation: z.enum(["exact", "source-variant", "sink-variant", "mechanism-subsequence"]),
      shared_claims: z.number().int(),
      shared_phenomena: z.number().int(),
      route_phenomena: z.number().int(),
    })
    .nullable(),
  /** Carrier handoffs whose declared requirements nothing on the route provides. */
  handoff_unresolved_count: z.number().int(),
  handoff_issues: z.array(z.object({ from_claim: ClaimId, to_claim: ClaimId, missing: z.array(z.string()) })),
  /**
   * Whether the atlas holds the numbers or relations that could bound what the route transmits:
   * quantified (a reviewed measurement of the whole composition), relation-complete (every
   * relation-required conversion step — drives, couples_to, or relation_requirement required — carries a
   * dimensionally valid constitutive relation; no route magnitude is thereby asserted), missing (such a
   * step has no relation; bottleneck_claim names the first). "incompatible" is reserved for a recorded
   * contradiction and is never inferred from absence. Pass 26 renamed the second value from "bounded",
   * which had overclaimed: a formula with no coefficient value bounds nothing numerically.
   */
  magnitude_screen: z.object({
    status: z.enum(["quantified", "relation-complete", "missing", "incompatible"]),
    bottleneck_claim: ClaimId.nullable(),
    detail: z.string(),
  }),
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
  /**
   * observed-not-converted when the exact route carries a pathway with status observed (loop-3 pass
   * 24): the composition's conversion physics has been traversed in one physical experiment, its
   * recorded output not delivered. The frontier class and search status are unchanged by it.
   */
  composition_observation: z.enum(["observed-not-converted"]).nullable(),
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
  /** Claims about the domain's phenomena that are established or replicated. */
  claims_established: z.number().int(),
  /** … demonstrated or reported. */
  claims_demonstrated: z.number().int(),
  /** Named pathways with at least one step in this domain. */
  named_pathways: z.number().int(),
  /** Matrix cells whose coupling family belongs to this domain, and how many of them are not searched. */
  matrix_cells: z.number().int(),
  matrix_cells_unsearched: z.number().int(),
  /** Reviewed search records targeting a cell or route in this domain. */
  reviewed_searches: z.number().int(),
  /** Publication year of the newest source cited by the domain's claims; null when none has a year. */
  newest_source_year: z.number().int().nullable(),
  /** Claims about the domain's phenomena with status reported, theoretically-predicted, hypothesised or disputed. */
  open_status_claims: z.number().int(),
  /** … contradicted or invalid. */
  contradicted_claims: z.number().int(),
  /** Inventory slugs not yet recorded as phenomena: the domain's work queue. */
  missing_from_inventory: z.array(z.string()),
  /** Automated index-only search runs targeting a cell whose family belongs to this domain. */
  index_only_searches: z.number().int(),
  /** Matrix cells in the domain's coupling columns with no search record of any kind. */
  matrix_cells_without_search_record: z.number().int(),
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
    /** The bounds the route enumerator ran under, and every disequilibrium whose enumeration stopped at the cap (its route set is truncated). */
    enumeration: { max_claims_per_route: number; max_routes_per_source: number; sources_at_cap: EntityId[] };
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
      /** Deprecated name for editorial_scope_fill; kept one release for readers of the old exports. */
      coverage_mean: number;
      /** Σ recorded phenomena / Σ inventory length across domains. Says how much of the atlas's own editorial scope is filled, nothing about nature. */
      editorial_scope_fill: number;
      /** Cells with any search record (reviewed or index-only) versus none. 897 − searched. */
      matrix_cells_without_search_record: number;
      /** Cells carrying at least one recorded direct relation. */
      matrix_cells_with_direct_relation: number;
      /** Cells whose computed status is not-searched (candidate cells with no search are not counted here); prefer matrix_cells_without_search_record. */
      matrix_cells_status_not_searched: number;
      /** Aliases with honest names; the old names are deprecated. */
      routes_enumerated: number;
      routes_with_recorded_composition_demonstration: number;
      matrix_cells_without_direct_relation: number;
      searches_reviewed: number;
      searches_index_only: number;
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
  /** Reviewed search records (statements). */
  searches: SearchRecord[];
  /** Automated index runs (frozen result lists a person can promote). */
  search_runs: AutomatedSearchRun[];
  /** Interface records (pass 26). */
  interfaces: Interface[];
  paths: CompiledPath[];
  matrix: { rows: MatrixAxis[]; cols: MatrixAxis[]; cells: MatrixCell[] };
  coverage: CoverageEntry[];
  source_verification: Record<string, { verified: boolean; checked_at: string; crossref_title?: string; note?: string }>;
  /** The condition-tag vocabulary (with each tag's default scope) and the exclusive groups, so pages and exports can show a label instead of a tag id. */
  ontology: { condition_tags: { id: string; label: string; description: string; default_scope: ConditionScope }[]; exclusive_groups: ExclusiveGroup[] };
};

export type EntityId = z.infer<typeof EntityId>;
