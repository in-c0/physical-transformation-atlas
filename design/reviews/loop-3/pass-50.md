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

## Reviewed (sent 12:16 am; ChatGPT High, ~7 min, with web search; PIVOT — 22 findings)

1. The loop is close to a clean close and passes 1–49 are not reopened (findings 1, 15–16, 19–21): the
   invariants, the residual model and the CURRENT / DEFERRED distinction stand; Planck rightly out of the
   live collection; the architectural change of loop 3 named — a graph edge, a constituent paper, a
   performance number, a bound, a search failure and an ontology guess are no longer interchangeable
   evidence, and the machinery can refuse claims it cannot justify; the weakest remaining layer is
   ontology semantics (a member_of classification can satisfy every structural rule and still be wrong).
2. Two corrections before the snapshot is signed (findings 2–14, 17–18, 22): (a) the two thermopolarization
   residuals are not single-source — the claims cite five and three sources from distinct groups (Marvan,
   Tagantsev, Trepakov, Onishi, Kholkin; Kholkin, Trepakov, Rafikov); they are reported because the
   separation from the flexoelectric contribution has not been read in a primary — a new kind
   evidence-interpretation-pending, the status unchanged; (b) claim:photostriction-member (photostriction
   member_of coupling:photovoltaic, hypothesised on Spanier 2016 — a bulk-photovoltaic paper that
   classifies nothing; photostriction is light-induced strain by several mechanisms, one of them a
   photovoltaic-then-converse-piezoelectric composition) removed, with a narrow rule that a residual on a
   member_of claim closes on classification evidence, never on "an experiment observing the effect"; do
   not preserve 37 as a target.

## Closed (12:25–12:45 am; both corrections applied, regenerated from source, live at rbfbfcbb70e57)

- Verified on the records: claim:temperature-drives-thermopolarization cites marvan-1969, tagantsev-1987,
  trepakov-1989, onishi-2025 and kholkin-1982; claim:thermopolarization-produces-charge cites kholkin-1982,
  trepakov-1989 and rafikov-1994; both carry the pass-28 review reason ("reported until the separation from
  the flexoelectric contribution is read in a primary text"). The closure audit now derives
  evidence-interpretation-pending for a reported claim with two or more author groups (statement: reported
  although N sources from M groups cite it; why: the record's own reason; closure: the curated Trepakov
  read), keeps evidence-single-source for exactly one group (gated), and gives a member_of claim's residual
  a classification closure (gated). claim:photostriction-member removed from radiative-spin.yaml with the
  reason recorded; the phenomenon and its drives / produces claims stay (both reported on Spanier 2016,
  unread — put to the reviewer as the next loop's first ontology question, not changed here).
- 523 claims; 36 residuals (evidence-interpretation-pending 2 · evidence-not-observed 5 ·
  evidence-single-source 4 · search-incomplete 13 · source-read-pending 9 · pathway-observed-not-delivered 1
  · measurement-boundary-unresolved 1 · measurement-definition-unresolved 1); the collection, the endpoint,
  the report and the /methods numbers regenerated from source; regressions added. 93/93.
