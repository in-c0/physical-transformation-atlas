# Pass 21 — the TOEC route search: one hit through a turbine, ruled a longer chain (21/09/2026 ~0:30–2:45 am Sydney)

Focus sent: the first route search whose target carries a proposed pathway — p-8fba925ce8, Temperature
gradient → Thermo-osmosis → Fluid flow → Aerodynamic and hydrodynamic lift → Mechanical motion →
Mechanical work (Straub et al. 2016's TOEC, 3.53 W/m² of hydraulic power, turbine proposed). The plan
was written under route-search-v1 from the recorded names after adding the spelling variants
thermoosmosis / thermo-osmotic / thermo-osmotic energy conversion and hydraulic turbine / turbine, run on
OpenAlex (198 reported, 100 + 50 newest; pair 4; whole-chain 1; precision 0; 136 works), screened by the
lane, and sent with the qualification question about the one hit that seemed to close the chain.
ChatGPT (High, ~11 min). Verdict: PIVOT — 11 findings.

Verification before sending: Xiao, Yan, Liu, Liu & Aziz 2024 (Energy Conversion and Management
314:118636) read in full — an author-shared copy located through Google Scholar, read in Chrome's Drive
viewer, never downloaded — a 32 cm² permeate-gap module pressurises its own permeate into an elevated
tank, and the released stream "propelled a hydro-turbine at a lower level, successfully lighting a
2 W light bulb"; head limited to about 1.5 m; liquid entry pressure 222 kPa; the 156.75 kW, 0.113 W/m²
and 1.04 % figures are the modelled solar case study, the 72-hour run used a "virtual hydro-turbine".
Luo et al. 2022/2023 (CEJ 452:139560), Luo 2023 (Applied Energy), Luo 2024 (Desalination 579:117485),
Ma 2025 (ECM), Gui 2025 (CES), Zhao 2021 (Sci China Tech Sci), Kuipers 2014 (MemPower), Li 2021 (stack
TOEC), Park 2017 (PRMD theory), Straub & Elimelech 2017, Moradi 2023, Touati 2025, Semenov 2015:
abstracts read on the publishers' pages, OpenAlex or Springer; Yuan 2019, Xiao 2023 and Lee 2022 have
no accessible abstract and are classified from their titles and from Lai et al. 2025's open-access
review, which describes them. ScienceDirect's full texts were not reachable (the lane completes no
captchas); Luo 2024 stays unread.

## What the second reader ruled, and what was applied

1. Xiao 2024 does not qualify: `longer-chain`, §3 item 6. The elevated tank is not exempt
   "non-converting apparatus" because the atlas spells a reservoir feeding a turbine as its own
   conversion — gravitational potential difference → hydrostatic descent → hydraulic pressure → lift,
   the hydroelectric spelling — and the paper itself calls its chain thermal → potential → mechanical.
   Item 4 passes qualitatively (mechanical work was delivered); "2 W" is the bulb's rating, never a
   measured output. The lane's reservation is recorded in the hit's reason: hydrostatically an open
   standpipe is a pressure accumulator, but an atlas that records head conversion as a phenomenon must
   apply that to itself. The protocol text gained the example (`searches/README.md` §3).
2. The recorded TOEC pathway keeps `status: proposed`, K5 and Straub as its evidence; its
   `performance.notes` now name the pressurised-flow experiments since 2014 and the one turbine run,
   and the hydraulic figure carries the pass-19 structured fields with the basis "pressure × permeate
   flux; the turbine stage proposed, not run".
3. The sibling route Temperature gradient → Thermo-osmosis → Fluid flow → Streaming potential → Ionic
   current → Electrical work (p-194168115f) gains the demonstrated pathway
   `thermal-osmosis-electrokinetic-generator` (K5; Huang et al. 2021, Luo et al. 2023: 1.12 W/m² and
   18.46 kg m⁻² h⁻¹ at ΔT = 50 °C, from the abstract; Huang's figures not recorded until its text is
   read), with its transducer and implemented_by claims — the explicit-flow cousin of the nanofluidic
   converter, recorded through the ordinary pathway path because the route search targeted a
   different composition.
4. Aliases the screening justified: `vapor pressure-driven osmosis`, `VPDO`, `pressure-retarded
   membrane distillation`, `PRMD` on thermo-osmosis (the field's names for the same vapour-gap
   transport; generic "membrane distillation" rejected as too broad); `MemPower` on the TOEC transducer.
   The plan was re-run with them: 203 reported, five PRMD papers and Park 2017's theory surfaced (139
   works) — the first run had missed every PRMD paper.
5. Luo 2024: `insufficient-information` with the reviewer's reason; the read is an owner action
   (exception `2026-09-20-physical-transformation-atlas-literature-search-ebed`, low, blocked-on-owner:
   UNSW library access would settle whether the turbine's output was measured).
6. The reviewed record `searches/2026-09-21-route-thermo-osmotic-energy-converter.yaml`: 21 decided
   hits (longer-chain 1; insufficient-information 1; constituent-only 5 — Straub 2016, Kuipers 2014,
   Li 2021, Zhao 2021, Yuan 2019; theory-only 7; review-only 1; sink-variant 4 — Huang 2021, Luo 2023
   ×2, Ma 2025; wrong-coupling 2 incl. the nanofluidic ionic cluster), nine runs (five OpenAlex, the two
   formal chase seeds Straub 2016 and 2017, plus Luo 2024 and Xiao 2024 as additional chases — the
   Xiao chase is how MemPower was found), `result: inconclusive`, `completeness: partial`, limitations
   naming the Semantic Scholar and Google Scholar gaps and the unread hit. The route's search state is
   search-incomplete; its page shows the record above the frozen runs.

## A consequence the reviewer did not expect

Recording the demonstrated MD-EPG pathway reclassed the TOEC route from candidate to `derived`: the
pass-16 head rule (a route sharing a demonstrated pathway's driver step and first conversion re-uses
its mechanism and diverges later) fires on the shared thermo-osmosis stage. Finding 10 expected three
candidates; the default frontier now shows two (the Marangoni streaming generators), and the TOEC
route sits under the derived toggle with its search record. The rule was left as written and the
consequence is put to the reviewer in pass 22; the regression test now asserts the new state and that
the derivation names the sibling, never the TOEC proposal (61/61).

Result: revision a01477586a49 — 483 claims · 175 sources · 80 pathways · 791 routes · 76 demonstrated ·
6 reviewed searches (2 cells, 4 routes) · axe clean · exports valid · live. Next, as recommended:
pass 22 searches p-423a19acdd (the thermocapillary Marangoni → streaming generator), whose partial
record and Pini 2015 proposal already exist and whose neighbouring precedent — temperature-driven flow
feeding a separate electrokinetic generator — is now a recorded pathway.
