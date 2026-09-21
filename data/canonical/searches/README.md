# Reviewed search records — protocol `cell-search-v1`

This directory holds the only records that may say **no demonstration found**. A record is a
review package, not one query: the literal queries submitted to each engine, when, how many records
came back, how many were screened and read, every plausible hit with the decision and the reason,
the reviewer, and a completeness statement. The schema is `SearchRecord` in
`packages/schema/src/index.ts`; the loader (`packages/graph/src/load.ts`) enforces the gate below,
so a negative that skips the protocol fails `pnpm validate`.

The atlas's first record, `2026-09-20-d-01-c-23.yaml` (Temperature gradient × Electrokinetic), is a
worked example — and a positive: the cell expected to be the first negative turned out to have a
physical demonstration (Zhao et al. 2020). That is the point of the protocol.

## The gate

`result: no-demonstration-found` is accepted only when all of these hold:

- `completeness: protocol-complete-negative`;
- `reviewed_by` names a person;
- no hit has `decision: qualifies`;
- runs cover **every discovery engine**: `openalex`, `semantic-scholar`, `google-scholar`
  (`crossref` only verifies DOIs; `manual` is a web search and does not count as an engine);
- runs cover **every mandatory query form**: `driver-family`, `driver-phenomenon`,
  `demonstration-precision` (`citation-chase` is required for a negative by protocol, see below,
  but is not machine-checked).

Otherwise the record must say `result: inconclusive` with `completeness: partial` or `blocked`.
A positive may stop early: `result: demonstration-found` needs one hit with `decision: qualifies`,
`completeness: conclusive-positive`, and a `follow_up` block saying whether the observation has
been turned into a canonical claim yet. Exhaustive searching is not required to prove existence.

## Protocol for one matrix cell

1. **Terms.** `D` = the driver's canonical name plus its scientifically useful aliases; `F` = the
   coupling family's name and aliases; `P_i` = every phenomenon that is a `member_of` the family.
   Use the aliases recorded in the atlas; add a term only if you also add it as an alias.
2. **Queries, per engine.** `D AND F` (`driver-family`); one `D AND P_i` per member phenomenon
   (`driver-phenomenon`); `D AND (F OR P_i) AND (experiment OR experimental OR measured OR device OR
   prototype)` (`demonstration-precision`). Record the literal syntax submitted to each engine in
   `runs[].query`; never reconstruct it later from the aliases.
3. **Screening depth.** Screen every result when ≤ 100; otherwise the first 100 by relevance plus
   the first 50 newest, de-duplicated across engines. Read the abstract or full text of every
   plausible hit. Record `records_retrieved / screened / read` per run and the de-duplicated totals
   in `screening`.
4. **Citation chase (negatives only).** For the two most relevant theory or review papers, inspect
   their reference lists and citing works for experimental predecessors or successors; record them
   as a `citation-chase` run.
5. **Decide each plausible hit** with one of: `qualifies`, `route-only`, `theory-only`,
   `simulation-only`, `proposal-only`, `review-only`, `wrong-driver`, `wrong-coupling`,
   `driver-only-modifies`, `duplicate`, `insufficient-information`; write the reason in one
   sentence a stranger can check. `route-only` means the experiment demonstrates a multi-step
   composition but not the direct driver × family relation being searched: it is evidence for a
   route (record it as a coupling claim after review) and must not promote the direct cell.
6. **Completeness.** If relevant unscreened results remain beyond the cap, an engine failed, a
   plausible hit is inaccessible, or a member phenomenon was not searched: `partial` or `blocked`,
   and the result is `inconclusive`. Only a complete protocol with nothing qualifying is
   `protocol-complete-negative`.

## What qualifies as a cell demonstration

All four: the matrix driver is experimentally **imposed** as the causal driver; an observable
belonging to a phenomenon in that coupling family is **measured**; it is a **physical** experiment or
device, not a simulation or theory; and the claimed relation does not require a separately
resolvable intermediate conversion family. A pressure-driven streaming-potential experiment in which
a temperature gradient merely changes the efficiency is `driver-only-modifies`; a prediction is
`theory-only`; a proposed harvester is `proposal-only`. A demonstrated multi-effect chain is evidence
for a **route** search (`target.kind: path`), not automatically a direct cell relation.

## Reviewed route searches — protocol `route-search-v1`

A route search asks one question: has one physical experiment or device demonstrated this exact
recorded composition? `target.kind` is `path`, `target.claims` lists the route's ordered claim ids
(the loader checks that their hash is the route id), `objective` is `exact-composition`, and the
target route is fixed before searching. Constituent evidence is not evidence for the composition.

### 1. Terms

Let `D` be the route's source disequilibrium; `M_1 … M_k` be its conversion phenomena in route
order, excluding carriers, bookkeeping nodes and the terminal output projection; and `O` be its
output.

For each `D`, `M_i` and `O`, construct the search term bundle only from that entity's canonical name
and recorded aliases. Engine-specific punctuation normalisation, such as replacing a hyphen with a
space for Semantic Scholar, is allowed; introducing a new lexical synonym is not. Add a
scientifically necessary term to the entity's aliases before using it in a query.

Freeze the term bundles in the search record (`driver_terms`, `phenomenon_terms`). Do not
reconstruct them later from a newer atlas revision.

### 2. Mandatory query forms

Run every mandatory form on OpenAlex, Semantic Scholar and Google Scholar. Each run carries its
`query_form` and a `query_key` that names which required query it is.

- `route-driver-mechanism`, key `driver-mechanism:1`: `D AND M_1`.
- `route-mechanism-pair`, key `mechanism-pair:i-(i+1)`: one query for every consecutive pair
  `M_i AND M_(i+1)`, for `i = 1 … k-1`.
- `route-whole-chain`, key `whole-chain`: `D AND M_1 AND … AND M_k AND O`.
- `route-demonstration-precision`, key `demonstration-precision`:
  `D AND M_1 AND … AND M_k AND O AND (experiment OR experimental OR measured OR device OR prototype)`.

All four forms are mandatory for a protocol-complete negative; `route-mechanism-pair` must cover
every consecutive mechanism pair. Record the literal submitted string, engine, execution time,
request URL where available, result count, retrieval depth, screening depth and reading depth.

OpenAlex and Google Scholar use their Boolean/phrase syntax. Semantic Scholar `paper/search` is a
relevance query, not a Boolean engine: submit the same concepts as a plain keyword string and store
that literal string. Do not pretend its spaces or quotation marks have Boolean semantics.

Google Scholar query-length exception. Google Scholar may reject or silently empty an expanded
Boolean query that exceeds its practical term limit. When that occurs, the mandatory run may use a
compact query selected only from the target search record's frozen term bundles. The compact query
must retain at least one term for every concept required by that query form: `D`, each required
`M_i`, `O` where required, and one demonstration term for `demonstration-precision`. Compaction
may omit aliases but may not omit a required concept, introduce an unrecorded synonym, or change
the target composition. Store the literal submitted query, mark the run `query_compacted: true`,
and store the corresponding unabridged bundle/query as `expanded_query`. A compact run satisfying
these conditions fulfils the same mandatory `query_key` as the expanded form. The observed limit
(about 32 words on 21/09/2026) is recorded in the run's note, not here: the invariant is concept
preservation, not a Scholar threshold.

Composite-name form. Some literatures name a multi-step composition with a single established
term while omitting one or more constituent mechanism names from titles and abstracts. A route plan
may therefore freeze `composition_terms`, each supported by at least one recorded source showing
that the term denotes a process or device spanning at least two concepts in the target composition.
When `composition_terms` is non-empty, every discovery engine must run `route-composite-name`, key
`composite-name`, as the OR of those frozen terms without requiring D, M_i or O to appear separately.
This form supplements and never replaces the decomposed route forms. Screen it at the same depth as
`route-driver-mechanism`. A composition term discovered during screening may be added with its
source and a recorded plan revision; after that addition the composite-name form becomes mandatory
before a protocol-complete negative may be issued. A composition term is route vocabulary, not an
alias of any constituent entity, and a phrase synthesised by concatenating mechanism names does not
qualify; a term marked `broad` (one the literature also uses for other compositions) is run all the
same and screened for the target route.

Scholar throttling and continuation. A mandatory Google Scholar query may be screened over
multiple sittings when CAPTCHA, throttling or session limits interrupt pagination. Each
continuation stores the same `query_key` and literal query, a `segment` number, the result
positions screened, and the interruption reason. Screening depth is cumulative over de-duplicated
result positions. The mandatory form is complete only when the protocol's required screening depth
has been reached; until then the search remains `partial`. Engine throttling never makes a
mandatory query form optional and does not count as a negative result.

Blocked attempts (recorded semantics, 21/09/2026, loop-3 pass 49 — the mandatory engines and forms
are unchanged). An engine that answers a throttle (HTTP 429) or a bot check before the first result
position is recorded as an attempt: a run with the literal intended query and `query_key`, the
execution time, `result_count_reported: null`, nothing retrieved or screened, `positions_screened:
none` and an `interruption` naming the blocker. Such a run counts toward nothing — not the engine's
coverage, not the key's, not the depth — and it may never carry `result_count_reported: 0`: a
blocked page is evidence that the engine was attempted, never that its query returned nothing.
Segments of one mandatory run (the same engine and key over several sittings) add their screened
positions together. The loader enforces both, and a negative's obligations are recomputed from
its target at load time rather than read from its stored completeness label.

### 3. What qualifies as a route demonstration

A hit `qualifies` only when all of these are true:

1. `D` is physically imposed or naturally present as the causal source of the experiment or device.
2. Every `M_i` occurs physically in the same experiment or device, in the recorded order.
3. Energy or the relevant physical carrier crosses every consecutive `M_i → M_(i+1)` handoff; merely
   mentioning both mechanisms in one paper is insufficient.
4. `O` is physically measured or delivered by the chain. A voltage/current with no extractable load
   need only qualify when the target output itself is that measured electrical response under the
   route's recorded meaning.

   Parallel-driver rule. When a target mechanism is one of two or more simultaneous drivers of the
   carrier entering the next target mechanism, the hit qualifies only if the experiment resolves the
   target mechanism's causal contribution to the downstream observable — for example by suppressing
   or reversing that driver while retaining the others, or by directly measuring the carrier
   attributable to that driver at the handoff. If the target driver or mechanism only enhances,
   amplifies or modifies a downstream device whose output is independently driven by another
   mechanism, classify the hit `driver-only-modifies`. If the target mechanism is physically observed
   but its contribution to the downstream output is not established, classify it `constituent-only`.
5. The evidence is a physical experiment or device, not theory, simulation or a proposed design.
6. No additional conversion phenomenon is required between two mechanisms that the target route
   records as consecutive.

The paper need not use the atlas's carrier-node vocabulary. A physically equivalent carrier
description is allowed if the conversion phenomena and their causal order are the same.

A paper demonstrating only one constituent mechanism or one adjacent pair is `constituent-only`, not
`qualifies`. The same ordered mechanisms and output with a different causal source are
`source-variant`: record the actual driver in the reason and review it as a possible different
pathway. The same source and ordered mechanisms with a different final output are `sink-variant`. A
physical chain that contains the target mechanisms but requires one or more additional conversion
phenomena between the target's recorded steps is `longer-chain`: evidence for that longer route, not
for the exact target. Extra instrumentation, reservoirs, electrodes, loads or non-converting
apparatus do not make a hit `longer-chain`. A reservoir the atlas spells as a conversion of its own
does: an elevated tank feeding a turbine is gravitational potential difference → hydrostatic descent
→ hydraulic pressure in the atlas's hydro spelling, so a thermo-osmotic flow stored at height before
the turbine is `longer-chain` for the direct thermo-osmosis → turbine route (the TOEC search of
21/09/2026, Xiao et al. 2024), however hydrostatically equivalent a standpipe and an accumulator are.

### 4. Decisions

Route decisions: `qualifies` (the complete target composition is physically demonstrated);
`constituent-only`; `source-variant`; `sink-variant`; `longer-chain`, as defined above. The cell
decisions remain available: `theory-only`, `simulation-only`, `proposal-only`, `review-only`,
`wrong-driver`, `wrong-coupling`, `driver-only-modifies`, `duplicate`, `insufficient-information`
and `route-only` — the last is primarily a cell-search decision; do not use it when one of the route
decisions applies. Every plausible hit receives one decision and one checkable reason.

### 5. Screening depth and citation chase

For each mandatory query, screen every result when the engine reports 100 or fewer. Above 100,
retrieve and screen the first 100 by relevance plus the first 50 newest where the engine exposes a
newest/date ordering; de-duplicate across runs and engines. Read the abstract or full text of every
plausible hit. Metadata alone cannot establish `qualifies`.

For a negative, citation chasing is mandatory. Take the two most relevant theory, review,
proposed-device or constituent-only papers and inspect both their reference lists and citing works
for an earlier or later whole-chain experiment. Record this as `citation-chase` runs (one per seed
paper) and record every plausible discovered hit.

### 6. Completeness and the negative gate (machine-checked by the loader)

A route may say `result: no-demonstration-found` only when: `protocol_version` is
`route-search-v1`; `target.kind` is `path` with `target.claims`; `objective` is
`exact-composition`; `completeness` is `protocol-complete-negative`; `reviewed_by` names a
reviewer; no hit has `decision: qualifies`; runs exist for all three discovery engines; each engine
has a run keyed `driver-mechanism:1`, every required `mechanism-pair:i-(i+1)` for the target route
(the loader derives `k` and the ordered `M_i` from `target.claims`), `whole-chain` and
`demonstration-precision`; every mandatory run records `records_screened` of at least the smaller of
100 and the reported count; and at least two `citation-chase` runs exist (one per seed paper).

If an engine fails, a mandatory query is absent, relevant results beyond the screening cap remain
unaccounted for, a plausible hit cannot be read well enough to classify, or citation chasing is
incomplete, the result is `inconclusive` with completeness `partial` or `blocked`. Presence of the
generic query-form name alone is insufficient; the keys are what the gate checks.

### 7. What the result changes

A conclusive positive changes only the target route's composition search state to `demonstrated`.
It does not change the evidence status of any constituent claim and does not create a direct matrix
relation. A person must then perform `follow_up.canonical_pathway_review`: if the paper demonstrates
the compiled route as recorded, add a canonical `Pathway` whose `steps` are that route's ordered
claim ids, add and verify the source, and record only measurements actually reported by the source;
set the field to `completed` when that review is committed. The compiler never authors a pathway.

A protocol-complete negative changes only that route's search state to
`searched-no-demonstration-found` as of the search completion date. It does not lower constituent
claim statuses, alter any matrix cell, classify the composition as impossible, or assert that no
demonstration exists outside the searched record.

### Query plans

The literal strings for a route search are written once, as a plan under
`data/canonical/searches/plans/<route id>.yaml` (protocol version, frozen term bundles, one entry
per engine × key with the exact query), and executed by
`pnpm --filter @pta/pipelines literature-search --path <route id> --plan <file>`, which freezes the
OpenAlex and Semantic Scholar result lists as an automated run. Google Scholar runs are recorded by
hand in the reviewed record.

## Promoting an automated run

`pnpm --filter @pta/pipelines literature-search` writes `data/generated/search-runs.json`: for each
cell the same query bundle as above against OpenAlex, with the frozen result list (OpenAlex id,
DOI, title, year, type, citation count, open-access URL; up to 100 per query), the literal query,
the request URL with any private `mailto` removed, and the timestamp. Those runs are
`screening_status: not-reviewed` and never change a cell. To promote one: open its frozen list,
record decisions and read depth, add the Semantic Scholar and Google Scholar runs and the citation
chase, and write one `SearchRecord` here whose `source_run_ids` names the run — nothing is re-run,
and readers can see exactly which result set was screened.

## Skeleton

```yaml
- id: search:2026-09-21-d-04-c-11
  target: { kind: cell, row: disequilibrium:pressure-gradient, col: coupling:thermoelectric }
  protocol_version: cell-search-v1
  started_at: "2026-09-21T10:00:00+10:00"
  completed_at: "2026-09-21T12:30:00+10:00"
  objective: direct-relation
  inclusion_criteria: [a pressure difference is the imposed causal driver, a thermoelectric-family observable is measured, physical experiment or device]
  exclusion_criteria: [theory or model only, simulation only, pressure only modifies a thermally driven experiment]
  runs:
    - { id: run:oa-family, engine: openalex, query_form: driver-family, query: '("pressure gradient" OR "pressure difference") AND (thermoelectric OR Seebeck)', executed_at: "2026-09-21T10:05:00+10:00", request_url: "https://api.openalex.org/works?…", result_count_reported: 212, records_retrieved: 100, records_screened: 100, records_read: 6 }
    # … one driver-phenomenon run per member phenomenon, a demonstration-precision run, the same on semantic-scholar and google-scholar, a citation-chase run
  screening: { records_retrieved: 640, unique_records: 412, title_abstract_screened: 412, full_text_read: 14 }
  hits:
    - { title: "…", year: 2019, doi: 10.xxxx/xxxxx, found_by: [run:oa-family], access: abstract, decision: driver-only-modifies, reason: "pressure changes the ΔT the device sees; the driver is still the heater" }
  result: no-demonstration-found
  completeness: protocol-complete-negative
  reviewed_by: your name
  reviewed_on: 2026-09-21
  limitations: [Google Scholar results beyond the first 150 were not screened]
  conclusion: what was searched for and what the hits actually were
  source_run_ids: [search:2026-09-19-d-04-c-11]
```
