# Status model: how each state is assigned

This document is about derivation and precedence — the order in which the compiler decides each
state field. It is not a dictionary: the definition of every value lives in one place,
[vocabulary.md](vocabulary.md) (generated from `packages/schema/src/vocabulary.ts` and served at
`/api/vocabulary.json`). Evidence thresholds for authors are in [evidence-model.md](evidence-model.md).
The code is `packages/graph/src/build.ts` and `packages/graph/src/structure.ts`.

Five fields answer five different questions and are never collapsed into one confidence label:

| field                   | question it answers                                                                 | assigned by                                     |
| ----------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| `claim.status`          | how well is this one relation known?                                                | the author, checked by the validator and a test |
| `path.search_status`    | has anyone looked for a demonstration of this whole composition?                    | the compiler, from pathways and search records  |
| `path.frontier_class`   | how does this enumerated route compare with evidence, checks and recorded pathways? | the compiler                                    |
| `path.structural_kind`  | is the route a genuine composition or a representational / engineering variant?     | the compiler (`structure.ts`)                   |
| `matrix.cells[].status` | what is on record for one driver × coupling-family coordinate?                      | the compiler                                    |

A value need not occur in every dataset revision; occurrence counts are in `/api/stats.json`
(`counts.claims_by_status`, `counts.paths_by_search_status`, `counts.paths_by_frontier_class`,
`counts.paths_by_structural_kind`, `counts.matrix_cells_by_status`).

## Evidence status (per claim)

Written by the author of the claim. The validator refuses a claim with no source unless its status
is `hypothesised`; a test refuses `replicated` without two independent first-author groups and
`established` without two independent groups or a review or book among its sources. A route's
`evidence_status` is the status of its weakest claim (`weakest_claim` names it).

## Search status (per route), in precedence order

1. `demonstrated` — a recorded pathway whose status is not `proposed` has exactly this claim
   sequence, **or** a reviewed search of the whole composition has `result: demonstration-found`;
2. `searched-no-demonstration-found` — a reviewed search of the whole composition has
   `result: no-demonstration-found` (the loader accepts that value only from a record that passed
   the protocol gate: `completeness: protocol-complete-negative`, a reviewer, no qualifying hit,
   OpenAlex + Semantic Scholar + Google Scholar, and the three mandatory query forms);
3. `search-incomplete` — any other search record exists for the composition (an automated index
   run, or a reviewed search that is partial, blocked or inconclusive);
4. `not-searched` — no record.

`candidate`, `under-review`, `experiment-proposed` and `experiment-tested` are in the schema but the
current compiler never assigns them; there is no review queue in this release.

## Frontier class (per route), in precedence order

1. `forbidden` — at least one of the seven checks returns `fail`;
2. `demonstrated` — search status is `demonstrated`;
3. `circular` — the source disequilibrium and the sink carry the same energy form;
4. if every constituent claim is at least `demonstrated`:
   - `incomplete-handoff` when a consuming step declares a carrier requirement
     (`handoff.requires_all` / `requires_any`) that no earlier step provides
     (`handoff_unresolved_count > 0`): the composition is not research-ready until the interface
     is recorded;
   - otherwise `derived` when the route overlaps a **demonstrated** pathway (status other than
     `proposed`) in one of two ways: by claims — at least two ordered claims shared
     (`known_pathway_overlap`) such that (a) the route contains the pathway's complete ordered
     claim sequence, (b) the route is a strict ordered prefix or suffix of the pathway, or the
     pathway of the route, (c) the ordered shared claims span two or more distinct conversion
     phenomena, or (d) the route and pathway share the driver step and first conversion and, at the
     first divergence, the route's next conversion phenomenon and the pathway's next conversion
     phenomenon share at least one coupling family; sharing only the driver step and one
     conversion phenomenon is not sufficient when the first divergence changes coupling family —
     that route remains a candidate (loop-3 pass 22) — and a shared generic tail (a produced
     carrier turning a rotor, a rotor turning a generator) never counts on its own — or by
     phenomena — at least two shared as a `source-variant` or `sink-variant` of the closest
     demonstrated pathway (`closest_known_pathway`; a `mechanism-subsequence` does not count);
   - otherwise `candidate`. A pathway with status `proposed` is attached to its exact route
     (`p.pathway`) and shown as a proposal, but is ignored for overlap and never changes the class;
5. `weak` — a constituent claim is below `demonstrated`.

So a candidate is: no physics check fails, source and sink do not collapse to the same energy form,
every constituent is at least demonstrated, every declared carrier handoff is provided, and neither
claim-level mechanism overlap nor a ≥ 2-phenomenon source/sink variant of a demonstrated pathway makes
the route derived. Nothing in the rule mentions novelty or searches: a candidate may be not searched,
search-incomplete, covered by a completed negative search, or the subject of a literature proposal.

## Structural kind (per route)

Computed after enumeration by `structure.ts`, in this order: `atomic` (fewer than two conversion
phenomena) → `representation-equivalent` → `representation-dominated` (a shorter spelling exists that
adds no seam or transition, or the longer one differs only by carrier relays such as a rotor in a
produced flow) → `energy-backtracking` → `known-device-likely` → `composition`; a `composition` whose prefix manufactures an ambient
(`ambient-common` or `ambient-conditional`) disequilibrium for a suffix that is itself an enumerated
route becomes `source-preparation` (`dominated_by` names the suffix); two compositions with the
same source, ordered coupling families (phenomena with no family, such as pure transport, are
transparent) and sink form collapse to one representative — a recorded pathway when the group has one,
chosen by shared cited sources, otherwise the shortest spelling. A route that exactly matches a recorded
pathway is always shown as `composition` and is never marked as dominated. The rules are spelled out in
[candidate-generation.md](candidate-generation.md).

## Matrix cell status, in precedence order

1. a direct relation is recorded — at least one `drives` claim from the row's disequilibrium to a
   phenomenon that is `member_of` the column's family. The cell then takes the best status among
   those claims: `established` (established or replicated), `demonstrated` (demonstrated or
   reported), `theoretical` (theoretically-predicted or hypothesised), `contradicted` (disputed,
   contradicted or invalid) — or `insufficient` when every direct claim cites nothing;
2. `forbidden` — the row's disequilibrium carries a `bounded_by constraint:second-law` claim;
3. `demonstrated` — a reviewed search of the cell has `result: demonstration-found`;
4. `candidate` — at least one bridge route (a route from the row that passes through a phenomenon of
   the column's family without starting at a direct one) has `structural_kind: composition` and
   `frontier_class` candidate, derived or demonstrated;
5. `searched-none` — a reviewed search of the cell has `result: no-demonstration-found`;
6. `search-incomplete` — any other search record exists for the cell;
7. `not-searched` — no record.

A search record can therefore change a cell only between states 3, 5, 6 and 7. It cannot create a
direct relation (state 1): that needs a canonical claim, reviewed separately. A `route-only` hit —
a real experiment whose driver reaches the family through a separately resolvable intermediate
conversion — is evidence for a route, never for the direct cell.

## Knowledge levels

K0 known physical quantity · K1 known interaction · K2 known transition · K3 theoretically
quantified · K4 experimentally observed · K5 energy harvested · K6 working transducer · K7
engineering prototype · K8 commercial technology (labels in [vocabulary.md](vocabulary.md)).

A named pathway sets its own level and the route that matches it inherits it. A composed route
with no demonstration has no level of its own: the compiler records its _constituent floor_ (the
lowest level among its claims) and caps the displayed level at K4, because the composition has only
been assembled, not observed. The site shows the floor and, separately, the composition's search
state; saying "K4 · experimentally observed" of an unassessed composition would be an overclaim.
