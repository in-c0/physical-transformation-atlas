# Pass 45 — the stage-versus-route measurement audit (21/09/2026 9:15–9:29 pm Sydney, build; message after)

Built on the reviewer's pass-44 order (findings 6–8 landed in the pass-44 close; finding 10 here):
every efficiency datum on a pathway classified by the boundary of its numerator and denominator as
read in its source — never by its scope label.

## Built

1. `design/reviews/loop-3/pass-45-dispositions.yaml` — 26 rows, one per efficiency datum (metric
   conversion-efficiency, device-stage-efficiency or carnot-relative-efficiency, or an unstructured
   datum whose quantity says "efficiency"), each with the numerator and denominator as read, a class
   (route · stage · population · other-route · unresolved) and an action (kept · restaged · ranged ·
   removed). `tools/audit-stage-route.mjs` joins it to the compiled graph, writes
   `pass-45-audit.md` and gates in the suite: every efficiency datum has a row; a removed row's datum
   is gone; a stage row's datum is `device-stage-efficiency`; a route or unresolved row's datum is
   `conversion-efficiency`; no range carries a scalar.
2. Classes: **route 18** — the μTPV's 2.5 % (Chan 2013's "input thermal power of 13.7 W" is the
   propane's heat release, the route's chemical input; basis now says so), the radioluminescent
   battery, the TREC pair, the two thermoacoustic generators, the Rankine plant pair, the PV module,
   the PEC cell, the two whole-battery betavoltaics, the rectenna element, the thermocapillary model
   and the thermophotovoltaic cell — LaPotin 2022's net-absorbed-radiation basis is the route's Q_h
   because the emitter is the route's hot reservoir; its basis now says why it is not a stage figure;
   **stage 4** — the hydro turbine's 73 % and the SiC device's 7.31 % (pass 44), and two restaged
   here: the pico waterwheel's 72–77 % (Asim 2022: wheel shaft power over stream power from the
   braked-torque tests, before the generator the pathway ends in — now `device-stage-efficiency` with
   `value_range: [0.72, 0.77]`, a range over blade shapes and conduit angles) and the OTEC design
   point 2.63 % (Lu 2024 read again on the MDPI XML: the paper's Equations 7 and 9 define the system
   thermal efficiency as η_net = (W_T − W_P)/Q_e, net cycle work before the generator — which
   reproduces the design value, 0.0263 × 1608.56 kW = 42.3 kW net = the 50.3 kW turbine less ≈ 8 kW
   of pump work, where the plain turbine-over-evaporator ratio did not); **population 1** — the TEG's
   handbook range "≈ 4–6 %" (Rowe 2006, Goldsmid 2016, no page read: a typical in a measurement's
   clothing) removed; **other-route 2** — the RTG "≈ 6–7 %" system range and Kraemer 2011's 4.6 %
   solar-thermoelectric figure removed from the temperature-gradient pathway (they belong to the
   radioisotope route and a solar-thermoelectric route the atlas does not record); **unresolved 2** —
   Lu 2024's actual 2.46 %, reported beside the 47.4 kW maximum grid-connected power without saying
   whether the numerator is grid power or net cycle work (the basis states the ambiguity), and the
   shape-memory engine's unstructured 1.5 % (pass 7; the paper's heat-input definition not read).
3. The TEG pathway keeps Zhang 2017's 12 % module datum as its only route figure; the waterwheel
   pathway has no route conversion-efficiency datum any more (its generator output was never
   quoted); the OTEC design point no longer competes for a best efficiency (model scope never did).
4. Regressions: the gate; the waterwheel range under `device-stage-efficiency` with no scalar and
   no route efficiency; the TEG's conversion-efficiency data exactly [0.12] and nothing from a
   handbook or another route; the OTEC design point restaged with W_T − W_P in its basis and the
   actual figure kept with "unresolved" in its basis; every route conversion-efficiency datum states
   a basis. 85/85.

Result: revision ab3198e8bf56 — 348 entities · 520 claims · 233 sources · 92 pathways · 2 systems ·
771 routes · 86 demonstrated · 85/85 · axe clean · exports valid · four audit gates consistent · live.

## Reviewed (sent 9:31 pm; ChatGPT High, ~8 min, with web search; PIVOT — 14 findings)

1. One substantive correction (findings 1–4): the Asim 2022 disposition was mis-sourced — the
   72–77 % undershot range is the paper's Introduction citing prior literature (its references
   13–14), not its measurement; the paper's own result, missed by the audit, is Section 4.9's
   overall efficiency of the system, 66.42 %: the C-shape wheel on a 3 kW generator at full load,
   η_overall = P_out / P_in with P_out = v_g·i_g (Equations 12–13). Remove the range entirely (never
   re-source it to Asim); record 0.6642 as the route's conversion-efficiency with a source-literal
   basis (P_in's formula is not stated in Section 4.9; Equation 11's power coefficient is a
   separate definition); regressions: a number a paper repeats from its literature review is never a
   measurement sourced to that paper.
2. The rest of pass 45 accepted (findings 5–7): the μTPV is a fuel-LHV-to-electric system result
   (the full text converts propane flow to watts by the lower heating value); LaPotin's η_TPV =
   P_out / (P_inc − P_ref) is the cell–emitter pair's figure, a route figure only because this
   pathway begins at the emitter's net radiative delivery — never to be reused as a heat-source-to-
   electric system efficiency; the OTEC 2.46 % conservatively unresolved.
3. Pass 46 set (findings 8–14): a narrow named pathway for Cheng 2018's exact architecture (an
   identifier carrying the 1.78 / 1.26 eV pair), the 19.3 % (acidic; 18.5 % neutral preserved as a
   condition) moved onto it, its 22.8 % as that pathway's `bounds[]` entry; the generic PEC pathway
   keeps no gap-pair ceiling; Fountaine's ideal 30.6 % / 40.0 % as class-level upper bounds whose
   `requires_basis` includes "PEC water splitting" (they bound water splitting, not every
   manifestation of the photoelectrochemical effect); the realistic cases (15.1 % / 28.3 %
   high-performance, 5.4 % / 16.2 % Earth-abundant) as benchmark constraints carrying their
   parameter bundles (absorption fraction, external radiative efficiency, catalytic exchange
   current densities, series and shunt resistance — Table 1's ideal / real1 / real2), in the
   source's words "realistic limiting efficiencies", never decisive.

## Closed (9:41–9:46 pm; findings 1–4 applied, live at rc9485dd7d33d)

- Verified on the MDPI XML: "the undershot design efficiency was recorded from 72 to 77%" sits in
  the Introduction after "[13,14]"; Section 4.9 reads "The turbine achieved an overall efficiency of
  66.42%" with Equations 12–13 as the reviewer quoted. The range is gone from the pathway and from
  the source note (which now says what the 72–77 % was); the 66.42 % is recorded as the route's
  conversion-efficiency (laboratory, measured) with the source-literal basis and the P_in caveat;
  the audit rows are now 27 (the mis-sourced row removed with its reason, the new row route /
  kept); the regression asserts the range is gone, the 66.42 % names the generator's electrical
  output and its unstated denominator, and the source note records the provenance. The waterwheel
  pathway's derived best efficiency is 66.4 %. 85/85, gates consistent.
