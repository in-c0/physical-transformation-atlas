# Candidate generation

Version 0.1 generates candidates by exhaustive enumeration, not by a model.

1. From every disequilibrium, follow process claims depth-first without revisiting a node, up to seven steps; record every route ending at an output. Cap: 4,000 routes per source.
2. Give each route a stable id: `p-` plus the first ten hex digits of SHA-1 over its claim ids joined by `>`.
3. Run the seven checks (`packages/physics/src/checks.ts`).
4. Match the claim sequence against named pathways; inherit status, level and performance when it matches.
5. Class the route for the frontier (see `status-model.md`).
6. Classify its *structure* (`packages/graph/src/structure.ts`), which says nothing about evidence:
   - `atomic` — fewer than two conversion phenomena: one effect plus bookkeeping to an output;
   - `source-preparation` — an internal node is an ambient-common or ambient-conditional disequilibrium and the suffix from it is itself an enumerated route: the prefix only supplies a driver that exists without engineering (`dominated_by` names the suffix);
   - `representation-equivalent` — the same mechanism as another route: a recorded pathway with the same source, ordered phenomena and sink energy form drawn with different carrier nodes, or (family-core collapse) another composition with the same source, ordered coupling families and sink form, in which case `dominated_by` names the representative (the shortest, then the lowest id);
   - `representation-dominated` — a shorter route with the same source and sink has its phenomena as an ordered subsequence and the extra phenomena add no cross-family seam and no energy-form transition;
   - `energy-backtracking` — an energy form reappears after a different one (A → B → A) with no new driver;
   - `known-device-likely` — every phenomenon is implemented by one common K6+ transducer, so the composition is probably an uncurated pathway;
   - `composition` — everything else: a genuine handoff between mechanisms.
   Every route also carries `effective_length` (conversion phenomena, not claims), the collapsed energy-form sequence, `family_seam_count`, `core_unresolved_count`, `implied_interface_count` and `magnitude_data_coverage`.

The frontier's default view is `frontier_class = candidate` and `structural_kind = composition`. Its order is lexicographic — structure, core-check resolution, evidence floor, mechanism novelty (one or two seams first), composition-search strength, source availability, effective length, overlap — never a synthetic score.

What is deliberately absent: no language model proposes relations, no link prediction fills the graph, no candidate is promoted without a person. The plan in `research/brief/` puts those after the representation has proved itself. When they arrive they will write to a review queue, not to `data/canonical`.

Useful commands:

```
pnpm --filter @pta/pipelines inspect fails    # every route that fails a check, with the reason
pnpm --filter @pta/pipelines inspect matrix   # cell status histogram
pnpm --filter @pta/pipelines inspect paths    # routes per source, frontier classes
```

## Scientific review

Changes to `data/canonical` go through a pull request. A reviewer checks:

1. Provenance — every new claim cites a source that actually says what the claim says. Open the DOI.
2. Status honesty — `established` only for textbook physics; a single paper is `reported`; a derivation is `theoretically-predicted`.
3. Conditions — the plain-language conditions and the condition tags describe when the relation holds. Tags feed the boundary check; a wrong tag makes routes fail or pass for the wrong reason.
4. Energy ledger — input and output forms agree with the neighbouring claims; run `pnpm build:graph` and read the summary for new energy-form failures.
5. Relations — if a formula is given, its coefficient unit must make the dimensional check pass; `inspect fails` names any that do not.
6. Search records — a record that says `no-demonstration-found` names the engine, date, query and reviewer, and the reviewer read the hits.
7. Addresses — new rows or columns are appended, never inserted.

Reviewers do not need to agree that a candidate route is promising. They need to agree that its constituent claims hold under the stated conditions and that nothing on the site claims more than the records support.

## Terminology

- Disequilibrium — a difference between a system and its surroundings that can drive change.
- Exergy — the work extractable from a disequilibrium relative to a reference environment. Energy at uniform temperature has exergy zero.
- Phenomenon — a named physical effect that converts one thing into another.
- Carrier — what moves the energy between two phenomena.
- Coupling family — a mechanism class a phenomenon belongs to; the matrix column.
- Claim — subject, predicate, object, conditions, evidence, status. The unit of knowledge here.
- Route / path — an ordered chain of process claims from a disequilibrium to an output. "Pathway" is reserved for a named, reviewed route.
- Composition — a route considered as a whole, as distinct from its constituent claims.
- Candidate composition — a route whose every constituent is at least demonstrated and whose composition has no demonstration on record.
- Bridge — a route from a matrix row that passes through a phenomenon of a matrix column's family, when no direct claim links them.
- Search record — what was looked for, where, when, by whom, with what result.
- Dataset revision — the hash of the canonical files shown as `r…` in the status rail.
