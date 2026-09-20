# Pass 17 — the first route-level literature search: protocol and queries (20/09/2026 ~9:55–11:05 pm Sydney)

Focus sent: the atlas had a reviewed-search protocol for a matrix cell but none for a route (an exact
composition), although the schema allowed `target.kind: path` and `objective: exact-composition`.
Asked for `route-search-v1` as exact protocol text (terms, mandatory query forms with ids, what
qualifies as a demonstration of a composition and how it differs from a constituent step, a
different driver or a longer chain, decisions, screening depth and citation chase, a machine-checkable
negative gate, what a positive and a negative change), then the exact query strings per engine for
the three genuine candidates, using only recorded names and aliases. ChatGPT (High, ~9 min, same
chat). Verdict: PIVOT — 4 findings.

## What was done

1. Schema and loader (finding 1): query forms `route-driver-mechanism`, `route-mechanism-pair`,
   `route-whole-chain`, `route-demonstration-precision`; `SearchRun.query_key`
   (`driver-mechanism:1`, `mechanism-pair:i-(i+1)`, `whole-chain`, `demonstration-precision`); hit
   decisions `constituent-only`, `source-variant`, `sink-variant`, `longer-chain`;
   `follow_up.canonical_pathway_review`; `target.claims` on path targets so the loader can derive
   the route's mechanisms and check that their hash is the route id. The route negative gate is
   machine-checked: protocol version, objective, completeness, reviewer, no qualifying hit, all three
   discovery engines each carrying every required key for the route's `k`, screening depth of at
   least min(100, reported) on every mandatory run, and two citation-chase runs. Three loader tests
   (a complete negative passes; a missing key on one engine or a missing chase is refused; a wrong
   hash or an under-screened run is refused) — 53/53.
2. Protocol text (finding 2) pasted into `data/canonical/searches/README.md` as
   "Reviewed route searches — protocol route-search-v1", plus a note on query plans.
3. Aliases (finding 3): `thermocapillary`, `solutocapillary` on the Marangoni effect;
   `thermomagnetic pumping` on thermomagnetic convection. "Electrokinetic energy conversion" was not
   added, as advised.
4. Query plans (finding 4) written verbatim for p-423a19acdd, p-41cb505083 and p-1043a15e01
   (`data/canonical/searches/plans/`), OpenAlex Boolean and Semantic Scholar keyword strings, one
   entry per engine × key. The runner gained `--path <id> --plan <yaml>` (runs come from the plan,
   never from aliases at run time; `target.claims` recorded; plan claims checked against the route),
   a Semantic Scholar engine with patient backoff, and `--engines` to run a subset and list the rest
   as not run in the bundle's notes.

Run tonight on OpenAlex (Semantic Scholar's anonymous pool answered 429 to every request for
twenty minutes; an API key is an owner signup and is filed as an exception): three frozen bundles
with `target.kind: path`, the routes' search state is now `search-incomplete` and each route page
carries a "Literature search for this exact composition" section listing every run with its key
and counts and the runs not yet made. Counts: p-423a19acdd driver-mechanism 1,393 reported (100
retrieved), mechanism-pair 1, whole-chain 0, precision 0; p-41cb505083 515 / 1 / 0 / 0;
p-1043a15e01 39 / 0 / 0 / 0. The one mechanism-pair hit on both Marangoni routes is
"Electro-Marangoni Effect in Thin Liquid Films" (Langmuir 2011, 10.1021/la1044656) — unread, to be
screened in pass 18 with the driver-mechanism lists.

Also: the vocabulary gained `search.engine`, `search.query_form` and `search.hit_decision`
(15 enumerations, 146 terms) so the exports define every search value; the AutomatedRunView names
its engines instead of assuming OpenAlex.

Result: revision r4f7c93086d83 (472 claims · 164 sources · 76 pathways · 742 routes · 7 automated
runs), 53/53 tests, axe clean, exports valid, live.
