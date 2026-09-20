# Pass 18 — screening the frozen route-search lists (20/09/2026 ~11:15 pm – 21/09 ~12:20 am Sydney)

Focus sent (new regular chat, ground rules restated): the three frozen OpenAlex lists from pass 17 —
101, 101 and 39 titles with years and DOIs — screened as the second reader under route-search-v1:
which works are plausible for the whole chain and with what expected decision, whether any looks
like a whole-chain experiment, the two citation-chase seeds per route, term gaps in the recorded
aliases, and whether the thermomagnetic list contains anything electrokinetic. ChatGPT (High,
~7 min). Verdict: PASS with 11 findings (nothing on the lists is a whole-chain experiment; a
protocol-complete negative is not yet reachable).

Every claim about a paper was checked before recording: Massing et al. 2019 abstract (Semantic
Scholar copy — Ohmic-heating thermocapillary flow at hydrogen bubbles, velocity and temperature
fields, no electrical output), the Tsekov 2011 electro-Marangoni abstract (drainage → streaming
potential → reverse surface flow), the 1990 thermocapillary/electrophoresis abstract, the Kim 2017
and Nguyen 2012 seeds on Crossref, Pini 2015's arXiv full text (uses "electrokinetic streaming" 15
times, "thermocapillarity-induced streaming", "destillocapillarity"). Two abstracts could not be
read (Ruckenstein 1981 and Pal et al. 2011 sit behind Elsevier; ScienceDirect answered with a
captcha, which the lane does not complete) and are recorded as metadata-only decisions from their
titles, never as read.

## What was done

1. Aliases the screening justified (protocol: add to the entity, never invent a query term):
   `electrokinetic streaming` on the streaming potential; `destillocapillarity` on the Marangoni
   effect; `thermomagnetic pump` on thermomagnetic convection. "Electrokinetic energy conversion"
   and "charge separation" were not added, as advised (too broad).
2. Plans re-run on OpenAlex with the new terms plus a 50-newest driver-mechanism run (the protocol's
   depth; the runner gained per-run `sort` / `per_page`). The mechanism-pair query now finds two
   works on both Marangoni routes — the second is Pini 2015 itself, exactly the retrieval gap the
   reviewer predicted. The 50 newest (2025–2026) titles were screened at title level: fluid
   mechanics of thermocapillary flow, nothing electrokinetic except an electric-field-driven TEHD
   paper and a gravity-driven sedimentation-potential paper, both recorded.
3. Citation chase on OpenAlex's reference lists and citing works for the seeds (Pini 2015 40 + 3;
   Massing 2019 54 + 101; Kim 2017 26 + 133; Pal 2011 27 + 61; Nguyen 2012 96 + 390), screened at
   title level with an electrokinetic/electrical vocabulary filter and read by eye: Pini's
   references are thermoelectrics and pressure-driven electrokinetic energy conversion; no
   whole-chain experiment surfaced. Two thermomagnetic "energy conversion" chase hits have no
   accessible abstract and are recorded as insufficient-information.
4. Three reviewed route records written (`searches/2026-09-20-routes-marangoni-thermomagnetic-streaming.yaml`),
   each `result: inconclusive`, `completeness: partial`, with the decided hits (theory-only,
   wrong-coupling, constituent-only, wrong-driver, insufficient-information), the run and chase
   counts, the limitations (Semantic Scholar and Google Scholar not run; depth; chase title-level)
   and a conclusion that says only what was searched. The routes' pages show the record above the
   frozen runs; their search state stays search-incomplete, as the gate requires.
5. A defect the counts exposed: a reviewed record with the same id as its frozen bundle was counted
   as reviewed twice (live showed 8 reviewed / 4 index-only). Records are now suffixed `-partial`
   (the pass-13 convention) and the loader refuses a reviewed record whose id matches an automated
   run.

Result: revision r09d04d09046c — 5 reviewed searches (2 cells, 3 routes), 7 frozen bundles; 53/53
tests; axe clean; exports valid; live. Next for these routes: the Semantic Scholar runs once the
owner's key exists (exception e953), Google Scholar by hand, and a read of the two unread chase hits.
