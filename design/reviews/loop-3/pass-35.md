# Pass 35 — the legacy performance audit (21/09/2026 2:44–3:02 pm Sydney, build; message after)

Built on the reviewer's pass-34 order (findings 18–31, 33): every `efficiency_typical`,
`efficiency_record` and `theoretical_limit` on every pathway — 87 fields on 47 pathways — disposed
in one deterministic table, the clear fixes applied, the ambiguous ones left visible with the exact
missing source or basis.

## The table

`design/reviews/loop-3/pass-35-dispositions.yaml` holds one disposition per (pathway, field) with
the reviewer's vocabulary (verified-same-architecture · different-architecture · unsupported-generic
· ambiguous-basis · model-only · benchmark-not-bound · wrong-quantity · migrate-to-measurement ·
remove), the action taken, the reason, and `was` (the value at audit) for every field since changed.
`tools/audit-performance.mjs` joins it to the compiled graph and writes
[`pass-35-audit.md`](pass-35-audit.md) — the columns the reviewer asked for (pathway, field, value at
audit, pathway architecture, current evidence, source support, basis known, disposition, action,
reason) — and fails when any legacy field lacks a disposition or a disposition contradicts the data
(a kept field gone, a removed field still there). The gate runs inside the test suite, so no legacy
field can be added or survive without a disposition.

Tally: different-architecture 2 · wrong-quantity 4 · model-only 1 · benchmark-not-bound 1 ·
unsupported-generic 5 · migrate-to-measurement 3 · ambiguous-basis 40 · verified-same-architecture
31 → removed 11 · rewritten 8 · migrated 4 · kept-visible 34 · kept 30.

## Applied

1. Cross-architecture and wrong bases (a, b): the combustion heater's HHV "limit" removed (finding
   22); OTEC's "Carnot ≈ 6.7% for 300 K against 280 K" and the Rankine plant's "≈ 65% for 873 K
   against 300 K; Curzon–Ahlborn ≈ 41%" rewritten to the generic form without numbers (finding 23;
   Curzon–Ahlborn named as a benchmark); the nuclear plant's "~600 K steam ≈ 50%", the solar-thermal
   Rankine's "Carnot at the receiver temperature" and the MHD generator's "Carnot at the plasma
   temperature; topping-cycle combinations projected at 50–60%" rewritten — operating states are not
   reservoirs and the topping projection belongs to the system layer; the photon-enhanced
   thermionic converter's "> 40% projected … with a thermal bottoming cycle" removed (a system
   projection; Schwede 2010's abstract is on neither Crossref nor OpenAlex, so the converter-alone
   claim is unverified); the TREC limit's "≈ 13% for 10–60 °C" removed — 1 − 283.15/333.15 is 15.0 %;
   the TEG limit keeps its relation and loses its worked example; the thermoacoustic limit loses the
   "≈ 40% of Carnot" engine benchmark.
2. Records (c): the TEG 0.12 removed as the positive control — exactly the structured Zhang 2017
   datum, now derived for display; the thermionic 0.15 removed (no device, temperatures or load
   basis; finding 26); the thermoacoustic 0.32 removed as an engine's thermal-to-acoustic figure on
   an engine-plus-alternator pathway (Backhaus & Swift 30 %, Tijani & Spoelstra 2011 49 % of Carnot
   with no alternator; the same-architecture figure is Backhaus, Tward & Petach 2004's, in a
   paywalled text); AMTEC's 0.2 removed as Cole 1983's projection ("an AMTEC of mature design
   should have an efficiency of 20 to 40 percent"). Migrated: TREC — Lee et al. 2014 read on the
   open Nature page gives 3.7 % without heat recuperation and 5.7 % with 50 % recuperation assumed,
   so the legacy 0.057 had carried an assumption: a device datum (3.7 %, T_h 333.15 K / T_c 283.15 K)
   and a model datum (5.7 %); TPV — LaPotin 2022's (41.1 ± 1) % at a 2400 °C emitter and 2.39 W cm⁻²
   as a device datum with `T_emitter_K` 2673.15 (no cell temperature in the abstract, so the Carnot
   check stays unresolved); PV — Green 2024 (Version 63) read on Wiley: the crystalline-silicon
   module record is 24.7 ± 0.3 % (Maxeon, 112 cells, 17,806 cm², NREL 4/23, Table 4), the legacy 0.27
   having been the 26.8 % silicon cell record rounded up; PEC — the 19 % is Cheng et al. 2018's
   (19.3 % STH acidic, 18.5 % neutral, abstract read), not Fujishima & Honda 1972's, recorded with its
   source. Kept visible with the missing basis named: Rankine 0.47 (candidate Bugge, Kjær & Blum 2006
   on Nordjylland 3, Crossref-verified, unread), wind 0.52 (a power coefficient), hydro 0.95 (turbine
   or plant), betavoltaic 0.06, rectenna 0.906 (Brown's own review, page unread), fuel cell 0.65,
   photosynthesis 0.045.
3. Typicals (d): removed where the only source is one paper or a projection — incandescent lamp
   0.02, electrokinetic microchannel 0.01, thermoacoustic 0.15 (a 1988 review of standing-wave
   engines), MHD 0.2, AMTEC 0.15; the other 24 kept visible as ambiguous-basis, each with the book or
   review it cites and the page or basis it needs (finding 29).
4. Limit prose (e): 30 verified as physical bounds with their bases and kept; four kept visible —
   the solar water heater's "~0.9" (a material absorptance beside the bound), the PEC "≈ 30 %"
   detailed-balance figure and photosynthesis' "≈ 12 %" (both unsourced), TPV's "> 50 % projected"
   (supported by LaPotin 2022's abstract, kept).
5. The display (findings 16, 28): the route page derives "best recorded efficiency" from the
   structured physical measurements (never a model datum) — the TEG page still says 12.0 %, from
   the datum, with the sentence that it is derived, not stored.
6. Regression controls (finding 31), all in the suite: the gas turbine has no 0.64; the combustion
   heater no HHV limit; OTEC no 300/280 K number; the TEG 12 % discoverable from its datum; the audit
   gate (`node tools/audit-performance.mjs --check`) passes; the combined cycle's 46.93 % exists only
   as a system measurement; a system refuses legacy summary fields. 74/74.
7. The structural note (findings 9–11), for the reviewer: the gas-turbine route abstracts over the
   compressor and its back-work — `carrier:hot-gas` is "Hot pressurised gas" while
   `claim:combustion-produces-hot-gas` guarantees no pressure; the pathway's typical 0.4 is a
   net-cycle figure the expansion-only core does not represent. Recorded as ambiguous-basis on the
   typical; no token frozen.

Result: revision b5dc2d347ba3 — 340 entities · 507 claims · 217 sources · 89 pathways · 1 system ·
751 routes · 74/74 · axe clean · exports valid · live.

## Reviewed (sent 3:05 pm; ChatGPT High, ~8 min, with web search; PIVOT — 33 findings) and applied (3:14–3:22 pm)

1. The machinery accepted (finding 1).
2. Every remaining `efficiency_typical` removed (findings 2–7): "visible" meant in the audit record
   with `was` and the missing basis, not as an asserted pathway number — the 24 book- or
   review-cited typicals (the gas turbine's 0.4 among them, doubly incommensurate with its
   expansion-only route) are gone from the canonical data, their values kept as `was` in the
   dispositions (action removed); `efficiency_typical` is no longer a writable Pathway field, the
   bound check and the coverage summary no longer read it, and no "typical" is derived from one or
   two measurements — a future typical needs an explicit population rule.
3. The Rankine record migrated (findings 8–14) without waiting for the Bugge 2006 owner read: the
   IEA Clean Coal Centre's open report CCC/255 (Nicol 2015, read in full on the USEA-hosted PDF)
   states Nordjylland unit 3 "reaches 47% net electrical efficiency (LHV) in power only mode" and was
   the world's most efficient pulverised-coal unit as of December 2014, with Table 4's 2005
   performance (411 MWe generator, 26 MWe auxiliaries, 385 MWe to the 400 kV grid, boiler efficiency
   94.2 %, 10 °C seawater cooling, 580/580/580 °C at 29 MPa) — recorded as a plant datum with the
   reviewer's basis wording (net, LHV, power-only, not annual), `T_turbine_inlet_K` 853.15 and
   `T_cooling_water_inlet_K` 283.15 as operating states, and the naked 0.47 deleted, the display
   deriving it. The reviewer's "Morrison 2008" IEA CCC citation could not be located; CCC/255 cites
   Morrison 2011 for the same fact, and the table's own calorific-value labelling ambiguity is in the
   note.
4. Regression controls extended: no stored typical anywhere; the Nordjylland datum carries its LHV
   basis. 74/74.
5. Pass 36 set (findings 15–31): the gas-turbine / expansion-carrier closure — `carrier:hot-gas`
   renamed "Hot gas" with a summary that implies no pressure; the token
   `thermodynamic:expansion-pressure-drop` frozen and required by `claim:hot-gas-drives-expansion`
   only; supplied by `pathway:combustion-gas-turbine.regime_provides` from Al Mhanna's 9.4 bar
   compressor discharge; no compressor claim and no combustion → pressure claim (a feedback branch,
   not a serial step); a pathway annotation `auxiliary_requirements[]` (kind recirculating-work,
   energy form, purpose, conditions, evidence) that never enters enumeration; a loader rule that a
   pathway supplying the token on a route through the expansion step must have a preceding provider
   or such an auxiliary; the nuclear plant left unresolved on purpose; the ideal-Brayton expression
   moved out of `theoretical_limit`; six regressions. Pass 37: `power_density` with the same
   machinery.

Result: revision cb2460d934f4 — 340 entities · 507 claims · 218 sources · 89 pathways · 1 system ·
751 routes · 0 stored typicals · 74/74 · axe clean · exports valid · live.
