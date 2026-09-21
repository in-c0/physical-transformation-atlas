# Pass 50 — the closure audit of loop 3 (22/09/2026 12:05–12:40 am Sydney, build; message after)

Built on the reviewer's pass-49 rulings (findings 6–29): the whole-atlas scientific closure — every
invariant regenerated rather than inspected, one residual inventory serving an immutable snapshot and a
live endpoint, and a report that names what the atlas does not know instead of eliminating it.

## Built

1. `tools/audit-closure.mjs` — three products from one computation. (a) Eleven invariants regenerated:
   the evidence-model rule on every claim; every demonstrated route's own pathway, status and sources;
   regime, handoff and boundary on the 86 demonstrated routes (regime unknown 59 · pass 27; 0 unresolved
   handoffs); the scalar / range invariant and a range never a best; no benchmark, constitutive relation
   or resource bound as a deciding comparison in any bound result (parsed from every route's detail);
   variant parent-step equality and a variant never a route's pathway, carried by exactly one route; the
   two systems' handoffs demonstrated; the four legacy performance keys absent; frontier counts (771:
   demonstrated 86 · candidate 185 · derived 309 · incomplete-handoff 45 · weak 47 · same-form 99; default
   frontier 10); the seven sibling gates re-run; v0.5.0 export validation over the built site and a
   targeted public-wording lint of the 1,895 built pages ("no demonstration found" outside a completed
   negative, "impossible", "no such device", "no demonstration exists", "has never been demonstrated",
   "proven impossible", "cannot exist", "maximum efficiency is" — with allowlisted contexts: the methods
   and coverage explanations, a bound's own "rather than declaring it impossible", a source note's quoted
   sentence). The lint caught three partial records whose conclusions began "No demonstration found: …"
   (p-ccef4f212b, p-8200d7ab7e, p-b820ec885f, written in passes 29 and 32) — reworded to "None found in
   the runs made (a partial, never a protocol-complete negative): …"; 0 hits after.
2. (b) The residual collection, derived: every inconclusive reviewed search with its obligations
   recomputed by the loader's rule (13: the ten default-frontier routes individually, p-b820ec885f, two
   cells); every hit decided insufficient-information (9); every reported claim (6) and every
   theoretically-predicted or hypothesised claim (6); the observed pathway (1); plus the two measurement
   items that need human words from `pass-50-curated.yaml` — Lu 2024's 2.46 % (boundary) and the SMA
   engine's 1.5 % (definition) — each verified against the current record (basis still "unresolved"; the
   datum still unstructured), so a resolved item fails the gate instead of lingering. Each residual: a
   deterministic id, one of seven kinds, the record it hangs on, the statement, why it is unresolved, what
   exists, what would close it (the curated closure notes name the Trepakov read and the missing Real1 /
   Real2 restatement), related ids, the public URL, and whether it sits on the default frontier. Public
   residuals carry no operational wording (a hit reason's "an owner read is requested" clause is dropped;
   the maintainer map from hits to owner exceptions stays in the report). Written once to
   `data/generated/residuals.json` (committed) and to the web app's copy; `pnpm build` now runs the
   closure step between the graph and the site.
3. (c) `/api/residuals.json` serves the collection unchanged with summary metadata (atlas revision,
   generated_at, residual_count, counts_by_kind, the kind vocabulary, the snapshot link) — a projection
   beside the exports, outside the v0.5.0 contract (`/api/stats.json` lists it under `projections`, an
   additive field); `/methods` §11b explains the three facts and links the live list and the snapshot;
   `pass-50-closure.md` renders the invariants, the cross-audit consistency lines, CURRENT RESIDUALS (37)
   and DEFERRED WORK (8: the Planck fraction — a formula bound on 31 routes with no datum stating an
   emitter temperature; Backhaus & Swift's temperatures; the 40 demonstrated pathways with no route
   efficiency datum; the engine keys; a route-search-v2; a pathway index nesting variants; composite-name
   terms for two routes; the pass-35 backlog), and closes with the sentence that nothing was cleared to
   improve the numbers.
4. Gate (`--check`, in the suite): every invariant holds; every residual's record exists; every closure
   condition is non-empty; every inconclusive search, reported / theory-only claim and undecided hit has
   a residual; the collection on disk, the web app's copy, the built endpoint's data and the report all
   match the atlas; negative controls — a curated item pointing at a measurement nobody recorded is
   refused as an orphan, and a collection missing a residual is refused naming it.
5. Regressions: the pass-50 test (the gate; one inventory shared by report, copy and endpoint; the ten
   frontier searches individually; counts of search, hit and claim residuals equal to their derivations;
   the two measurement residuals; closure conditions; no operational wording in public residuals; the two
   negative controls). 93/93.

Result: revision 2c5212e271e9 — 353 entities · 524 claims · 235 sources · 93 pathways (92 + 1 variant) · 2 systems ·
771 routes · 86 demonstrated · 37 residuals · 93/93 · axe clean · exports valid · eight audit gates
consistent · live.
