# Data contract

How to reuse the atlas without reading the site. Everything public is a static file under
`https://physical-transformation-atlas.wldud5192.workers.dev/api/`; there is no query API, no
authentication and no rate limit beyond the CDN's. The machine-readable form of this page is the
JSON Schema at `/api/schema/v0.4.0.json`; every export names its own `$defs` entry in `meta.schema`.

Reuse terms: none declared yet — see [licensing.md](licensing.md). How to cite: `CITATION.cff` at
the repository root, plus the `data_hash` you used.

## The envelope

Every JSON export is `{ "meta": {...}, "data": ... }`, sometimes with one extra top-level key
(`links`, `verification`). `meta` is the same shape everywhere:

| field                                                       | meaning                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dataset`                                                   | always `physical-transformation-atlas`                                                                                                                                                                                                  |
| `endpoint`                                                  | which export this is (`claims`, `paths`, …)                                                                                                                                                                                             |
| `version`                                                   | schema version of the export format; changes when a field is added, renamed or removed                                                                                                                                                  |
| `data_hash`                                                 | **the dataset revision**: twelve hex characters of a SHA-256 over every canonical file. Two exports with the same `data_hash` were compiled from identical canonical data                                                               |
| `generated_at`                                              | when the graph was compiled (ISO 8601). Provenance only; it says nothing about literature currency                                                                                                                                      |
| `source_commit`                                             | git commit of the canonical files; `-dirty` suffix when uncommitted edits were present; `null` when the build ran outside the repository                                                                                                |
| `search_indexed_through`                                    | the latest date any search record (reviewed or automated) covers; `null` when there are none. This is the literature-currency date                                                                                                      |
| `enumeration`                                               | the bounds the route enumerator ran under (`max_claims_per_route`, `max_routes_per_source`) and `sources_at_cap`, every disequilibrium whose route set was truncated by the per-source cap (empty means no truncation in this revision) |
| `record_kind`                                               | `canonical` (rows written by a person in `data/canonical`), `generated` (compiled from canonical rows at this `data_hash`), `mixed`, or `none`                                                                                          |
| `records`                                                   | number of rows in `data`, when `data` is a list                                                                                                                                                                                         |
| `counts`                                                    | dataset-wide counts and occurrence maps (below)                                                                                                                                                                                         |
| `schema`                                                    | URL + fragment of this export's JSON Schema definition                                                                                                                                                                                  |
| `license`                                                   | `{ spdx, status, note }`; `status` is `PENDING_OWNER_RULING` until a licence is declared                                                                                                                                                |
| `citation`, `contract`, `changelog`, `vocabulary`, `checks` | where to find the citation file, this page, the revision history, the enumeration definitions and the physics-check registry                                                                                                            |
| `canonical_url_rules`                                       | how each record kind maps to a page you can cite                                                                                                                                                                                        |

`counts` carries the totals (`entities`, `claims`, `sources`, `routes_enumerated`,
`routes_with_recorded_composition_demonstration`, `matrix_cells`, `matrix_cells_with_direct_relation`,
`matrix_cells_without_direct_relation`, `matrix_cells_without_search_record`, `searches_reviewed`,
`searches_index_only`, `editorial_scope_fill` = Σ recorded phenomena / Σ inventory length, …; the older
names `paths_examined`, `paths_demonstrated`, `matrix_cells_empty`, `matrix_cells_unsearched` (status
count, not the search-record count) and `coverage_mean` are kept one release and deprecated) and
occurrence maps that say which vocabulary values this revision actually uses:
`claims_by_status`, `claims_by_predicate`, `paths_by_search_status`, `paths_by_frontier_class`,
`paths_by_structural_kind`, `matrix_cells_by_status`, `entities_by_type`. A value defined in the
vocabulary may occur zero times in a given revision.

## Endpoints

| file                                                 | `data`                                                                                                            | record kind | notes                                                                                                                                                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/stats.json`                                    | `{ endpoints: [...] }`                                                                                            | none        | the meta block alone, plus this list                                                                                                                                                                                                          |
| `/api/graph.json`                                    | `{ entities, claims, sources, pathways, searches, search_runs, matrix, coverage, source_verification, ontology }` | mixed       | the whole atlas except compiled routes; `links.paths` points at them. `searches` are reviewed records (`reviewed: true`); `search_runs` are frozen automated index runs, never reviewed statements; `ontology.condition_tags` is the tag list |
| `/api/entities.json`                                 | `Entity[]`                                                                                                        | canonical   |                                                                                                                                                                                                                                               |
| `/api/claims.json`                                   | `Claim[]`                                                                                                         | canonical   | the scientific unit of the atlas                                                                                                                                                                                                              |
| `/api/claims.ndjson`                                 | one JSON object per line                                                                                          | canonical   | first line is `{ kind: "meta", … }`; each claim line carries `kind: "claim"`, `data_hash` and `canonical_url`                                                                                                                                 |
| `/api/claims.csv`                                    | one row per claim                                                                                                 | canonical   | columns listed below; list fields are JSON arrays inside a cell                                                                                                                                                                               |
| `/api/sources.json`                                  | `Source[]` + top-level `verification`                                                                             | canonical   | `verification[source id]` = Crossref title match for the DOI with the date checked                                                                                                                                                            |
| `/api/pathways.json`                                 | `Pathway[]`                                                                                                       | canonical   | named, reviewed compositions with measured performance; `route_id` and `canonical_url` name the compiled route that records each                                                                                                              |
| `/api/systems.json`                                  | `SystemPathway[]`                                                                                                | canonical   | the system layer (pass 34): multi-route systems joined by documented handoffs; each member carries `route_id` and `route_checks`, the system its `handoff_status`; `canonical_url` is the system's page |
| `/api/paths.json`                                    | `CompiledPath[]`                                                                                                  | generated   | every enumerated route (≤ 7 steps) with checks, structure and search status; 1.7 MB                                                                                                                                                           |
| `/api/matrix.json`                                   | `{ rows, cols, cells }`                                                                                           | generated   | axes with stable addresses (`D.nn`, `C.nn`); one cell per pair                                                                                                                                                                                |
| `/api/coverage.json`                                 | `CoverageEntry[]`                                                                                                 | generated   | per-domain coverage against the target ontology                                                                                                                                                                                               |
| `/api/checks.json`                                   | `CheckDefinition[]`                                                                                               | none        | the seven physics checks: id, label, definition, when each result is given, fields read, implementation                                                                                                                                       |
| `/api/vocabulary.json`                               | `VocabularyEnum[]`                                                                                                | none        | every enumeration with one definition per value and where it is used                                                                                                                                                                          |
| `/api/schema/v0.4.0.json`                            | JSON Schema (draft 2020-12)                                                                                       | none        | `$defs` per export and per record type, generated from the zod definitions                                                                                                                                                                    |
| `/api/schema/v0.3.0.json`, `/api/schema/v0.2.0.json` | JSON Schema (draft 2020-12)                                                                                       | none        | frozen copies of the previous export formats, kept so that older exports' `meta.schema` URLs still resolve                                                                                                                                    |

`claims.csv` columns, in order: `data_hash, id, subject, predicate, object, status, conditions_json,
condition_tags_json, energy_input, energy_output, energy_dissipation, relation_formula,
relation_input, relation_output, coefficient_unit, evidence_ids_json, canonical, last_reviewed,
canonical_url, notes`.

## Records

Field-by-field definitions are in the JSON Schema (`$defs.Entity`, `$defs.Claim`, `$defs.Source`,
`$defs.Pathway`, `$defs.CompiledPath`, `$defs.MatrixCell`, `$defs.CoverageEntry`,
`$defs.SearchRecord`); the source of truth is `packages/schema/src/index.ts`. What follows is the
reading guide.

**Entity** — `id` is `<type>:<slug>`. `type` is one of the thirteen entity types (vocabulary
`entity.type`). Optional fields are typed by role: `dimension`/`unit` on quantities;
`quantity`, `exergy`, `availability` on disequilibria; `energy_form` on carriers and outputs;
`bound`, `constraint_kind` (upper-bound / formula-bound / resource-bound / constitutive-relation /
benchmark), `metric`, `max_efficiency` or `formula` + `formula_inputs`, `requires_basis`,
`reference_value` / `reference_regime` and the applicability filters `applies_to_sources` /
`applies_to_outputs` / `applies_to_phenomena` on constraints (only an upper-bound or formula-bound
can pass or fail a route's thermodynamic-bound check); `knowledge_level` on transducers.
`condition_tags` are machine-checkable regime tags (`data/canonical/ontology/conditions.yaml`).

**Claim** — `subject —predicate→ object`, with `conditions` (prose), `condition_tags` (the flat form),
`condition_requirements[]` (`{ tag, scope, region }`, the scoped form since pass 26 — vocabulary
`condition.scope`; region is a slug, `active` by default; the export always carries the effective
requirements, expanded from the flat tags with each tag's default scope when a claim has not been
curated; entity-level tags are never inherited into a step),
`energy` (`input`, `output`, optional `dissipation`; declared on process claims), an optional
constitutive `relation` (`formula`, `input` and `output` quantities, `coefficient_unit`,
`conventions`), an optional `handoff` (`provides[]` on a producing step, `requires_all[]` /
`requires_any[]` on a consuming step, as tokens such as `flow:bulk`, `flow:directed-momentum`,
`motion:relative-flux-change` or `acoustic:travelling-wave` — an acoustic field carrying directed
time-averaged momentum along a propagation direction, which a pure standing wave does not provide;
the compiler checks them across each carrier), an optional
`relation_requirement` (`required` / `not-applicable` / `unknown`; drives and couples_to steps default
to unknown, produces and converts_into to not-applicable), `regime_requires[]` / `regime_provides[]` /
`regime_external[]` (pass 30: regime tokens such as `thermal:temporal-temperature-change` a step needs
from its causal source, supplies to later steps, or has supplied by an independent external condition
— never a property of its own subject; disequilibria carry `regime_provides[]` and `regime_excludes[]`,
pathways `regime_provides[]` for the operating regime their evidence establishes on their exact route;
the eighth check, `driver-regime-sufficiency`, compares them and never infers a provider from prose.
Since pass 36 every token is frozen in a registry with its definition (`REGIME_TOKENS`, served as
vocabulary `regime.token`; an unregistered token fails validation): the thermal, field, mechanical
and light tokens of pass 30, `flow:bulk-fluid-motion` (pass 41: nonzero bulk motion of the heat-carrying fluid, required by advective heat transport and by the hot-gas → MHD step, supplied by `disequilibrium:fluid-flow` — the source whose content is that motion — or by a reviewed pathway's pump auxiliary or an upstream flow-producing step), `field:transverse-magnetic-field` (pass 41 close: a nonzero magnetic-field component transverse to the conducting fluid's velocity in the active MHD region — an externally imposed field, so the MHD driving steps carry it as `regime_external`) and `thermodynamic:expansion-pressure-drop` — an upstream pressure state and
a lower downstream one sufficient for the working fluid to perform expansion work, required by the
hot-gas → expansion step and supplied by a reviewed pathway only with a preceding providing step or an
`auxiliary_requirements` entry explaining how its implementation establishes it), `evidence` (source ids), `status`
(vocabulary `claim.status`), optional `knowledge_level`, `review` and `notes`. The four process predicates (`drives`, `produces`,
`couples_to`, `converts_into`) carry energy between nodes and are the only ones routes are built
from; the rest are descriptive (vocabulary `claim.predicate`).

**Source** — bibliographic record; `doi` when one exists. Crossref verification lives beside the
export in `verification`, not on the record.

**Interface** (pass 26) — a physical boundary between two regions of a device: `id` (`interface:` + slug),
`location` (`{ between_claims: { from_claim, to_claim } }` for the handoff between two adjacent
steps, or `{ within_claim }` for a boundary internal to one step, such as an MHD channel's
electrodes), `kind` (vocabulary `interface.kind`), `from_region`, `to_region`, `carrier` (entity id
or null), `handoff_token` (or null), `relation` (the atlas's relation form, input and output the same
quantity and a dimensionless coefficient, or null), `conditions`, `condition_requirements`, `evidence`,
`status` (vocabulary `interface.status`: a demonstrated record resolves the region transition it
names; theoretical and proposed records are shown and leave the boundary check unresolved), `notes`,
`review`. Served in `graph.json` as `interfaces`; a route lists its own under `interfaces_recorded`.

**Pathway** — a named, reviewed composition: ordered `steps` (claim ids), `demonstrated_with`
(transducer ids), `evidence`, `status` (`demonstrated`, `prototype`, `commercial`, `proposed`,
`observed` — vocabulary `pathway.status`), `observed_through` (required iff `status: observed`: the
last step the evidence physically established, never the final one), `regime_provides[]` (pass 30: the
operating regime this exact pathway's evidence establishes, seen only by its own route),
`auxiliary_requirements[]` (pass 36: `{ kind: recirculating-work | parasitic-load | external-input, energy_form,
purpose, establishes[] (regime tokens), conditions[], evidence[], note }` — loads and inputs the named
implementation needs off its linear route, such as the compressor a gas turbine drives from its own shaft;
metadata that never enters enumeration, and the only way a pathway may supply a token whose registry entry
says a provider needs explaining), `bounds[]` (pass 42: `{ constraint, evidence[], conditions[], note }` — a typed upper-bound or formula-bound constraint valid only for this exact architecture, refused by the loader when the route already reaches it through a `bounded_by` claim; generic bounds live on phenomena), `knowledge_level`, `performance` (a strict object since pass 42: only
`notes` and `measurements[]` (`power_density` was retired in pass 37: a power density lives only as a measurement with its denominator in the unit and its normalisation in the basis; a bare power is the `power` metric) — one record per number with the quantity, the value
as written in the source, the scope, the regime, the sources and the year, and optionally its
structured form: `value_numeric`, `unit`, `metric` (which bounded quantity it is), `basis` (what the
number is defined on) and `parameters` (the inputs a formula bound needs, such as `T_h_K` and
`T_c_K`; since pass 31 the keys are drawn from the registry served as vocabulary
`measurement.parameter` — T_h_K, T_c_K, T_initial_K, T_final_K, dT_dt_K_s, T_transition_K,
temperature_gradient_K_m, gradient_length_m, cycle_frequency_Hz, T_emitter_K, T_collector_K, the
operating-state names T_turbine_inlet_K, T_turbine_exhaust_K, T_cooling_water_inlet_K and T_condenser_K
(never the Carnot reservoirs; only T_h_K / T_c_K feed the reservoir bound) and the bound inputs — and
an unknown key fails validation; a pathway's own non-model parameters also supply regime tokens to
its exact route (a `model` datum supplies none, a `material` datum only a transition): T_h ≠ T_c a spatial gradient, dT/dt ≠ 0 or T_initial ≠ T_final a temporal
change, a transition temperature between the two straddled, a cycle frequency with both sides cyclic
exposure; never to a sibling route, and never Swift's threshold) — only a structured datum is ever
compared with a bound, and a `model` datum is evaluated but never decides the route: the check reports it as
model-consistent or model-inconsistent and stays unresolved until a physical-scope datum can be evaluated (pass 33)), `environment`, `summary`,
`review`, `regime_model_provides[]` (regime tokens a model asserts — recorded, never a provider for the
core check). A pathway with `status: proposed` or `status: observed` is attached to its route but never
makes it demonstrated and is ignored when other routes are classified as derived.

**SystemPathway** (pass 34) — the system layer, for architectures one linear route cannot express (a
topping gas turbine delivers electrical work AND hands its exhaust enthalpy to a bottoming steam cycle):
`id` (`system-pathway:` + slug), `name`, `members[]` (`{ id, pathway, role }` — a slug local to the
system, a whole Pathway, a descriptive role such as `topping-cycle` / `bottoming-cycle`, not yet a closed
vocabulary), `handoffs[]` (`{ from_member, to_member, from_energy_form, to_source, carrier, kind,
conditions[], evidence[], status, note }` — `to_source` is the disequilibrium the receiving member's route
starts from and the loader refuses any other; `through` (pass 40: the transducer the handoff crosses, a PWR's steam generator); `kind` ∈ `residual-energy | recovered-heat | transferred-heat |
mechanical-coupling | electrical-coupling | material-flow`; `status` ∈ `demonstrated | theoretical |
proposed`, a demonstrated handoff citing evidence), `outputs[]` (`{ member, output, aggregation: sum |
separate }` — the output must be the member route's terminal output), `evidence`, `status`
(`demonstrated | prototype | commercial | proposed`), `knowledge_level`, `performance` (`{ measurements[], notes? }` — measurements only: a system
never carries `efficiency_typical`, `efficiency_record`, `theoretical_limit` or `power_density`, the
schema refuses them; a system's efficiency lives here as a structured datum and on no member), `summary`,
`review`. Compiled (generated) fields: each member gains `pathway_name`, `pathway_status`, `route_id`,
`route_checks` (the eight checks of its exact route, id → result) and `core_unresolved_count`; the
system gains `handoff_status` (its weakest handoff's) and `members_core_clear` (true only when every
member route has no unresolved core check AND every handoff is demonstrated). A handoff is never a
route claim, so the system layer never enters route enumeration, the matrix or the candidate frontier,
and the eight checks are not run over a system. Served as `/api/systems.json` and in the graph core's
`systems[]`; the vocabulary blocks are `system-pathway.status`, `system-handoff.kind`,
`system-handoff.status` and `system-output.aggregation`.

**CompiledPath** (generated) — `id` is `p-` plus ten hex characters of a SHA-1 over the ordered
claim ids; `nodes`, `claims`, `source`, `sink`, `length`; `evidence_status` (the weakest
constituent), `established_steps`, `search_status`, `frontier_class`, `knowledge_level`,
`pathway` (when a named pathway records exactly this route), `checks[]` (eight results, each
`{ id, label, result, detail }`), `coupling_families`, `domains`, `literature`,
`constituent_source_ids` versus `composition_source_ids` (evidence for the steps is never evidence
for the composition), `constituent_floor`, `phenomena`, `effective_length`,
`energy_form_sequence`, `energy_transition_count`, `family_seam_count`, `core_unresolved_count`,
`implied_interface_count`, `implied_interfaces` (the adjacent-step medium transitions on a continuing
region that no interface record names, "claim → claim: tag vs tag"), `interfaces_recorded[]`
(`{ interface, kind, status, location }`: the interface records between the route's adjacent steps or
within its steps, of any status), `interface_model_coverage` (`{ with_relation, of }`: recorded
interfaces that carry a transmission relation — outside the magnitude screen by design), `weakest_claim` (the step with the route's weakest status; ties go to the earliest step),
`closest_known_device` (`{ transducer, shared_steps, of }`: the recorded device implementing the most
effects on the route, or null), `device_coverage` (`{ implemented, of }`: how many of the route's effects
some recorded device implements), `closest_known_pathway` (`{ pathway, relation, shared_claims,
shared_phenomena, route_phenomena }`: the recorded pathway with the longest common phenomena
subsequence; `relation` is `exact`, `source-variant` (shared tail: the route reaches the recorded
mechanism from a different driver), `sink-variant` (shared head) or `mechanism-subsequence`),
`handoff_unresolved_count` and `handoff_issues[]` (`{ from_claim, to_claim, missing[] }`: declared
carrier-handoff requirements nothing earlier on the route provides — unresolved, never "impossible"),
`magnitude_screen` (`{ status, bottleneck_claim, detail }`: `quantified` when a reviewed measurement
covers the whole composition, `relation-complete` when every relation-required conversion step carries a
dimensionally valid constitutive relation — a `drives` or `couples_to` step, or one whose
`relation_requirement` is `required`, as in the dimensional check; a `produces` step projects a carrier
and is not asked for one; no route magnitude is asserted, which is why the value is not called bounded —
`missing` otherwise; `incompatible` is reserved for a recorded contradiction), `magnitude_data_coverage`, `representation_signature`,
`semantic_overlap`, `structural_kind`, `dominated_by`, `source_availability`,
`known_pathway_overlap`, `composition_observation` (`observed-not-converted` when the exact route
carries an `observed` pathway, else null). Enumerations: vocabulary `path.search_status`,
`path.frontier_class`, `path.structural_kind`, `path.composition_observation`,
`path.magnitude_screen.status`, `check.result`.

**MatrixCell** (generated) — `row` and `col` entity ids, `address` (`D.nn:C.nn`), `status`
(vocabulary `matrix.cell.status`), `direct_claims`, `direct_phenomena`, `bridge_paths` (route ids),
`searched`, `last_searched`, `works_found`.

**CoverageEntry** (generated) — per domain: `phenomena` recorded against `target_phenomena` (the
length of the domain's editorial checklist in `ontology/domains.yaml`; `missing_from_inventory` lists
the unrecorded slugs), `claims`, `claims_with_evidence`, `ontology_coverage` (editorial scope fill,
not clamped), `literature_coverage` (citation completeness), `claims_established`,
`claims_demonstrated`, `open_status_claims` (reported / theoretically-predicted / hypothesised /
disputed; the older name `unresolved_claims` is kept), `contradicted_claims`, `named_pathways`,
`matrix_cells`, `matrix_cells_without_search_record`, `matrix_cells_unsearched` (status count),
`reviewed_searches`, `index_only_searches`, `newest_source_year`.

**SearchRecord** — a reviewed literature search as a review package: `protocol_version`,
`started_at`/`completed_at`, `objective`, inclusion and exclusion criteria, `runs[]` (one per
engine × query form, with the literal query, timestamp, request URL, reported count, and how many
records were retrieved, screened and read), de-duplicated `screening` totals, `hits[]` (each with
`decision` and `reason`), `result`, `completeness`, `reviewed_by`, `reviewed_on`, `limitations`,
`conclusion`, `source_run_ids` and, for a positive, `follow_up`. The only record that may say _no
demonstration found_, and only when the protocol gate passes; see
`data/canonical/searches/README.md`. Automated index runs are a different type, `AutomatedSearchRun`
(`graph.search_runs`): frozen result lists with `screening_status: not-reviewed`.

## Provenance and null semantics

Canonical records carry `review: { canonical, last_reviewed, reviewer? }`. `last_reviewed` is a
date only when a person or a logged review pass actually re-read the record on that date; otherwise
it is `null`. The schema never manufactures a review date. Generated records carry no `review`;
their provenance is the envelope (`record_kind: generated`, `data_hash`, `source_commit`).

An absent optional field means _not recorded_, never _false_ or _zero_. `search_indexed_through:
null` means no search record exists. `source_commit: null` means the build ran outside the
repository.

## Identifiers and canonical URLs

Published ids and matrix addresses are never reassigned to a different semantic record. Entity,
claim, source and pathway ids are hand-written slugs and stay fixed once published; if a record
is retired its id is not reused. Route ids are content-derived from the ordered claim ids, so the
same composition has the same id in every revision, and the compiler fails if two different
sequences ever hash to the same id. Matrix rows and columns are numbered in file order and only
ever appended, so `D.04 × C.11` keeps its meaning.

| record      | canonical URL                                         |
| ----------- | ----------------------------------------------------- |
| entity      | `/e/{type}/{slug}`; phenomena at `/phenomenon/{slug}` |
| claim       | `/claim/{slug}`                                       |
| source      | `/source/{slug}`                                      |
| route       | `/path/{ten hex characters after "p-"}`               |
| pathway     | the route page of its `route_id`                      |
| matrix cell | `/matrix?cell={row address}:{column address}`         |

Each claim, entity, source, route and cell in the exports carries its `canonical_url`. Cite a
canonical URL together with `version` and `data_hash`.

## Revisions

A revision is a `data_hash`. It changes whenever any canonical file changes, and only then; a
rebuild of unchanged data yields the same hash with a new `generated_at`. Each revision that was
published is listed in [dataset-changelog.md](dataset-changelog.md) with its counts, the ids added
and removed, and the pass logs that explain the scientific changes.

The export format has its own `version`. Adding a field is a minor bump; renaming or removing one is
a major bump, and the old schema URL keeps resolving.

Format history: **v0.2.0** — the `{meta, data}` envelope, canonical URLs, counts and occurrence maps,
JSON Schema, vocabulary and checks registries (revisions r58d98b9384c9 to r787a4f923ee5).
**v0.3.0** — adds `meta.enumeration` (the enumerator's bounds and the sources truncated by the
per-source cap); nothing renamed or removed, so a v0.2.0 reader can ignore the new field. **v0.4.0**
— typed limits and structured measurements (loop-3 pass 19): constraints gain `constraint_kind`,
`metric`, `formula`, `formula_inputs`, `reference_value`, `reference_regime`, `requires_basis`,
`applies_to_outputs` and `applies_to_phenomena`; measurements gain `value_numeric`, `unit`, `metric`,
`basis` and `parameters`; claims gain `relation_requirement`; the check labels for `conservation`
(now "Source work availability") and `practical-magnitude` (now "Measured performance coverage")
change while their ids stay. Nothing renamed or removed. Within v0.4.0, additive changes dated 21/09/2026 (loop-3 passes 22–24): search runs gain the optional fields `query_compacted`, `expanded_query` (route-search-v1's Google Scholar compaction exception), `segment`, `positions_screened` and `interruption` (the continuation rule); `Source.type` gains `preprint`; `Pathway.status` gains `observed` with the companion field `observed_through`, and CompiledPath gains `composition_observation` (pass 24). Pass 27: `SearchRecord` and the automated bundles gain `composition_terms[]` (`{ term, evidence[], broad? }`, the field's names for a whole composition) and `query_form` gains `route-composite-name` (key `composite-name`), mandatory on every engine once a term is frozen. Pass 26: `Claim` gains `condition_requirements[]`, the graph gains `interfaces[]` (the Interface record) and `ontology.exclusive_groups[]`, `ontology.condition_tags[]` gain `default_scope`, CompiledPath gains `interfaces_recorded[]` and `interface_model_coverage`; the conditions ontology's pairwise `conflicts` shrink to two universal same-region rows with two exclusive groups (material state; temperature regime) replacing the rest; and one enum value is renamed — `magnitude_screen.status` `bounded` → `relation-complete` — which no published revision before rc3c317847bc7 (live for about an hour on 21/09/2026) had ever emitted, because the screen could not reach it until pass 25. Pass 34: the system layer — the graph core gains `systems[]` (the SystemPathway record above), a new endpoint `/api/systems.json` and `counts.systems_named`; nothing else changes. Pass 35: `Pathway.performance.efficiency_typical` is no longer written (every stored value was removed; a reader that still expects it sees it absent). Pass 36: `Pathway.auxiliary_requirements[]` added; regime tokens are validated against the registry served as vocabulary `regime.token` (with the new block `pathway.auxiliary_requirement.kind`). Pass 42: `Pathway.performance.theoretical_limit` is no longer written and the performance object is strict — every limit is a typed constraint entity reached through a `bounded_by` claim on a phenomenon or, for one exact architecture, a `Pathway.bounds[]` entry (`{ constraint, evidence[], conditions[], note }`, upper-bound | formula-bound only); the thermodynamic-bound check merges both through one applicability / metric / basis machinery; four constraint entities (the Planck visible-band fraction, the reversible electrochemical efficiency ΔG/ΔH, the photosynthetic glucose free-energy limit, the physiology-limited photosynthetic maximum as a benchmark) and seven claims were added so that no limit lived only in prose; the measurement parameters `delta_G_kJ_per_mol` and `delta_H_kJ_per_mol` join the registry. All four legacy performance summary keys are now gone. Pass 41 (closing): one enum value is renamed — `path.frontier_class` `circular` → `same-form` ("source and sink carry the same energy form"; the old name and its UI label "round trip" asserted a return to a starting state the compiler never checked — a pumped loop delivering heat is thermal → thermal and no round trip); revisions before rc24d8d754de3's successor emitted `circular`, so a reader filtering on it sees an empty class, not an error. `path.structural_kind` of a route that exactly matches a recorded pathway is `atomic` when the route carries a single conversion phenomenon (42 of the 92 recorded pathways; they were written as `composition`, contradicting the served definition "two or more conversion phenomena"); its evidence still reads from `frontier_class` and `search_status`. `disequilibrium:fluid-flow` now carries `regime_provides: [flow:bulk-fluid-motion]`. Pass 40: `SystemHandoff` gains `through` and the kind `transferred-heat`; a member whose terminal output is not exported must be the from_member of a handoff of that energy form (loader-checked). Pass 39 (closing): `Measurement` gains `datum_kind` (`measured | derived | design-point | simulated | projected`, vocabulary `measurement.datum_kind`; a model-scope datum must carry one of the last four, a measured datum is never model scope), `reference_constraint` (required as `constraint:carnot-limit` for the new metric `carnot-relative-efficiency`), and `theoretical_limit` carries only bounds — benchmarks and achieved fractions of a bound are typed constraints or structured data, never prose; `Pathway.performance.efficiency_record` is no longer written — every record efficiency is a structured physical measurement and pages derive the best recorded value. Pass 37: `Pathway.performance.power_density` is no longer written (every stored value was removed or migrated); `metric` gains `power`; a density metric's unit must state its normalisation and the measurement carries `normalization: { kind: area | volume | mass | length | count, basis }` with the basis drawn from the registry served as vocabulary `measurement.normalization.basis` (`unstated` when a source gives only the dimension) — the same unit never implies a comparable density, so a derived "best recorded power density" groups by metric, unit, kind and basis; an absolute `power` carries none. Otherwise nothing renamed or removed; a v0.4.0 reader that ignores unknown fields and unknown enum values is unaffected, one that validates `type`, `status` or `magnitude_screen.status` strictly must accept the new values.
