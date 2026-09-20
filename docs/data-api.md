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

**Claim** — `subject —predicate→ object`, with `conditions` (prose), `condition_tags`,
`energy` (`input`, `output`, optional `dissipation`; declared on process claims), an optional
constitutive `relation` (`formula`, `input` and `output` quantities, `coefficient_unit`,
`conventions`), an optional `handoff` (`provides[]` on a producing step, `requires_all[]` /
`requires_any[]` on a consuming step, as tokens such as `flow:bulk`, `flow:directed-momentum` or
`motion:relative-flux-change`; the compiler checks them across each carrier), an optional
`relation_requirement` (`required` / `not-applicable` / `unknown`; drives and couples_to steps default
to unknown, produces and converts_into to not-applicable), `evidence` (source ids), `status`
(vocabulary `claim.status`), optional `knowledge_level`, `review` and `notes`. The four process predicates (`drives`, `produces`,
`couples_to`, `converts_into`) carry energy between nodes and are the only ones routes are built
from; the rest are descriptive (vocabulary `claim.predicate`).

**Source** — bibliographic record; `doi` when one exists. Crossref verification lives beside the
export in `verification`, not on the record.

**Pathway** — a named, reviewed composition: ordered `steps` (claim ids), `demonstrated_with`
(transducer ids), `evidence`, `status` (`demonstrated`, `prototype`, `commercial`, `proposed`),
`knowledge_level`, `performance` (`efficiency_typical`, `efficiency_record`, `theoretical_limit`,
`power_density`, `notes`, and `measurements[]` — one record per number with the quantity, the value
as written in the source, the scope, the regime, the sources and the year, and optionally its
structured form: `value_numeric`, `unit`, `metric` (which bounded quantity it is), `basis` (what the
number is defined on) and `parameters` (the inputs a formula bound needs, such as `T_h_K` and
`T_c_K`) — only a structured datum is ever compared with a bound), `environment`, `summary`,
`review`. A pathway with `status: proposed` is attached to its route but never makes it
demonstrated.

**CompiledPath** (generated) — `id` is `p-` plus ten hex characters of a SHA-1 over the ordered
claim ids; `nodes`, `claims`, `source`, `sink`, `length`; `evidence_status` (the weakest
constituent), `established_steps`, `search_status`, `frontier_class`, `knowledge_level`,
`pathway` (when a named pathway records exactly this route), `checks[]` (seven results, each
`{ id, label, result, detail }`), `coupling_families`, `domains`, `literature`,
`constituent_source_ids` versus `composition_source_ids` (evidence for the steps is never evidence
for the composition), `constituent_floor`, `phenomena`, `effective_length`,
`energy_form_sequence`, `energy_transition_count`, `family_seam_count`, `core_unresolved_count`,
`implied_interface_count`, `implied_interfaces` (the adjacent-step tag conflicts, "claim → claim: tag vs
tag"), `weakest_claim` (the step with the route's weakest status; ties go to the earliest step),
`closest_known_device` (`{ transducer, shared_steps, of }`: the recorded device implementing the most
effects on the route, or null), `device_coverage` (`{ implemented, of }`: how many of the route's effects
some recorded device implements), `closest_known_pathway` (`{ pathway, relation, shared_claims,
shared_phenomena, route_phenomena }`: the recorded pathway with the longest common phenomena
subsequence; `relation` is `exact`, `source-variant` (shared tail: the route reaches the recorded
mechanism from a different driver), `sink-variant` (shared head) or `mechanism-subsequence`),
`handoff_unresolved_count` and `handoff_issues[]` (`{ from_claim, to_claim, missing[] }`: declared
carrier-handoff requirements nothing earlier on the route provides — unresolved, never "impossible"),
`magnitude_screen` (`{ status, bottleneck_claim, detail }`: `quantified` when a reviewed measurement
covers the whole composition, `bounded` when every conversion step carries a constitutive relation,
`missing` otherwise; `incompatible` is reserved for a recorded contradiction), `magnitude_data_coverage`, `representation_signature`,
`semantic_overlap`, `structural_kind`, `dominated_by`, `source_availability`,
`known_pathway_overlap`. Enumerations: vocabulary `path.search_status`, `path.frontier_class`,
`path.structural_kind`, `check.result`.

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
change while their ids stay. Nothing renamed or removed.
