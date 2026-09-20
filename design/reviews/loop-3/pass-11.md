# Pass 11 — the coverage page and the honesty of the whole-atlas numbers (20/09/2026 ~3:25–3:55 pm Sydney)

Focus sent: does each number on /coverage mean what its label says; are the domain targets
defensible; which whole-atlas numbers read as statements about nature; what a physicist wants from a
coverage page that this one lacks; are the home rail's numbers the right five in the right order.
ChatGPT (High, ~5 min). Verdict: PIVOT — 12 findings.

## Findings (condensed) and what was done

1. "Ontology" and "Literature" overstated what the bars measure; phenomena without an outgoing claim
   were not counted as recorded. → Columns renamed *Editorial scope fill* and *claims with source /
   claims*; the lead sentence is the one specified ("These measures describe this atlas, not the
   completeness of physics or the scientific literature …"); a phenomenon record counts whether or not
   it has a claim yet.
2. `coverage_mean` (97 / 395 hand-set slots = 24.6 %) read as physics coverage. → `editorial_scope_fill`
   = Σ recorded / Σ inventory length, not clamped; `coverage_mean` kept one release, deprecated; the
   aggregate line states "97 / 430 editorial checklist slots in this revision (22.6 %); the denominator
   is maintained by the atlas and is not an estimate of the number of physical phenomena in nature";
   the percentage is gone from the home rail.
3. `matrix_cells_unsearched` counted the *status* not-searched (709) and omitted candidate cells with no
   search; the actual no-search-record count is 894 of 897. → `matrix_cells_without_search_record`
   (= cells with `!searched`), `matrix_cells_status_not_searched` kept as the old count.
4. Corpus labels. → "97 phenomenon records", "455 canonical claim records", "66 recorded named
   pathways", "681 routes enumerated from the current claim graph", "65 with a recorded complete-
   composition demonstration", "830 with no recorded direct relation"; stats.json gained the aliases
   `routes_enumerated`, `routes_with_recorded_composition_demonstration`,
   `matrix_cells_with_direct_relation`, `matrix_cells_without_direct_relation`, `searches_reviewed`,
   `searches_index_only`; the old names are deprecated in the contract.
5. "Indexed through" rendered the build time. → Four facts: dataset generated · search records through
   (or "none") · reviewed search records · index-only search runs — this revision reads
   2026-09-20 · 2026-09-19 · 0 · 3.
6. Five targets corrected: thermodynamics 40 → 25, spin systems 20 → 30, quantum transport 20 → 35,
   biophysical transduction 15 → 30, surfaces and interfaces 20 → 30, with the reviewer's reasons
   recorded as `target_basis`.
7. Scalar targets are not auditable. → Every domain now carries a `target_inventory` checklist of
   phenomenon slugs (recorded + missing); `target_phenomena` is derived by the loader as its length
   and can no longer be typed; the loader rejects a recorded phenomenon missing from its domain's list
   and duplicate slugs. The nine un-reviewed targets were reconstructed as inventories of the same
   length, marked "reconstructed from the previous scalar target"; the coverage page lists every
   domain's recorded and missing phenomena, so the work queue is public.
8. Table columns. → Domain · editorial scope fill · recorded / scope target · claims with source /
   claims · established+replicated / demonstrated / open · no-search cells / matrix cells · reviewed /
   index-only searches · newest cited source · named pathways, with the specified formulae compiled
   into `CoverageEntry` (`claims_established`, `claims_demonstrated`, `open_status_claims`,
   `contradicted_claims`, `matrix_cells`, `matrix_cells_without_search_record`, `reviewed_searches`,
   `index_only_searches`, `newest_source_year`, `named_pathways`, `missing_from_inventory`) and the
   multi-domain-pathway note in the table caption.
9. Citation completeness is 100 % everywhere; quantum transport has 0 named pathways and a newest
   source of 2015. → Now visible as such; the column is labelled "newest cited source", never
   "indexed through".
10. "Unresolved" was vague. → `open_status_claims` with the same four-status formula; the corpus line
    reads "N reported / theoretical / hypothesised / disputed claim records", and contradicted/invalid
    would show separately.
11. Home rail: eight counts → five in instrument order: 23 × 39 driver × coupling matrix · 67 cells
    with recorded direct relations · 894 cells with no search record · 12 frontier candidate
    compositions · 65 routes with composition demonstrations.
12. Matrix stamp. → "3 INDEX-ONLY CELL SEARCHES · 0 REVIEWED SEARCHES · SEARCH RECORDS THROUGH
    2026-09-19 · DATASET r…", generated.

Also: the build summary line uses the honest names; the nine-column table scrolls in its own box
(the overflow probe caught it at 1440 px); coverage `main` widened to 1180 px.

Result: revision reb5d9bbf4edd · scope fill 97 / 430 · 894 cells without a search record · 38/38
tests · exports valid · axe clean, live.
