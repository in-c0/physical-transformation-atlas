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
