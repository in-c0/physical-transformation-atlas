# Pass 13 — closing the loop the first search opened (20/09/2026 ~10:20 pm – 21/09 ~12:10 am Sydney)

Focus sent, in two parts: (A) the follow-up data review the first reviewed search left pending —
does Zhao et al. 2020 warrant a canonical claim, and which phenomenon is it really; (B) the first
attempt at a protocol-complete negative on D.04 × C.01 (Salinity gradient × Thermoelectric), with the
honest completeness a web session can claim. ChatGPT (High, ~8 min). Verdict: PIVOT — 10 findings.

Mechanics: the regular chat tab froze again at the end of the reply; killing the renderer and
reloading the conversation recovered it (the reply lives in server state). Before the reply arrived I
added `--cell` to the runner and froze the OpenAlex bundle for D.04 × C.01 (8 queries, 51 unique
works), so the negative could reference a real result list.

## Part A — what Zhao 2020 actually is

1–3. Not `temperature-gradient —drives→ streaming-potential`. The paper says the mechanism "was
   investigated from the aspect of thermoosmosis": ΔT drives thermo-osmotic liquid motion, the
   double layer makes it ion-selective, the moving counter-charge is the current, and the current
   direction reverses with surface charge (pH). I re-read those sentences in the PMC full text before
   accepting the reclassification. So the observation is the existing `thermo-osmosis` coupling into
   the existing `streaming-potential` — no new phenomenon. Recorded as
   `claim:thermo-osmosis-couples-streaming` (`couples_to`, five conditions, kinetic → electrical,
   `status: demonstrated` — one paper — with handoff `provides: [flow:liquid, flow:confined,
   surface:charged]`) and `source:zhao-2020-thermo-nanofluidics` (Crossref-verified; 137/137 DOIs).
4. The pass-12 record therefore over-claimed. The protocol's fourth qualification rule — no
   separately resolvable intermediate family — is exactly what this hit fails. `HIT_DECISIONS` gained
   `route-only`; the Zhao hit is now `route-only` with the mechanism as its reason; the record is
   `inconclusive / partial` with `follow_up.canonical_claim_review: completed`. D.01 × C.23 shows
   *candidate* again (a composed bridge exists; no direct relation), and the route Temperature
   gradient → Thermo-osmosis → Streaming potential → Ionic current → Electrical work is now a
   candidate composition built on a demonstrated coupling. The distinction matters: a route search
   must never manufacture a direct matrix edge.

## Part B — Salinity gradient × Thermoelectric

5–8. A strong negative candidate with two known false-positive clusters: salinity-gradient solar
   ponds feed ordinary TEGs (the pond's 40–60 °C ΔT is the driver; salinity suppresses convection and
   stores heat → `wrong-driver`), and nanofluidic "ionic Peltier / ionothermoelectric" papers
   (charge-selective ion transport in nanopores, not the solid-state family → `wrong-coupling`). The
   five exact query strings per engine are recorded. Eight hits screened with decisions and reasons
   (Singh 2011, Singh 2012, Ziapour 2017, Tsutsui 2024, Tsutsui 2025, Tseng 2016, Yip 2016, Rastgar
   2023 — every DOI resolved). Citation chase of the two major reviews leads to PRO/RED/CapMix/TOEC
   and pond TEGs; nothing qualifying.
9–10. Committed as `search:2026-09-20-d-04-c-01-partial`: `result: inconclusive`, `completeness:
   partial`, with `source_run_ids` naming the frozen OpenAlex bundle, and limitations stating that
   Semantic Scholar and Google Scholar were not run and no full text was read. The cell reads
   *index query only · not reviewed* (search-incomplete), not *no demonstration found* — the loader
   would have refused the latter from these runs, which is the gate doing its job.

Also: the drawer's "Prepare search" now emits the full cell-search-v1 bundle (family, per-phenomenon,
precision) with one OpenAlex link each, instead of a single query; `isoDateTime` accepts the
runner's fractional-second timestamps.

Result: 456 claims · 156 sources · 692 routes · 2 reviewed searches (both honest partials) · 4 frozen
OpenAlex bundles · 42/42 tests · exports valid · axe clean, live.
