# Pass 32 — the thermopolarization effect's own route searched; the polar-liquid spelling (21/09/2026 12:52–1:25 pm Sydney)

Records first (committed 6114b3a, live 9b94e6bcfa4d before the message went out): the plan
`p-b820ec885f` (temperature gradient → thermopolarization → separated surface charge → electrical
work; `thermopolarization` frozen as the composition term on Kholkin 1982, Tagantsev 1987, Trepakov
1989 and Onishi 2025; the output bundle widened to power, load and harvesting), run on OpenAlex at
12:53 pm — driver-mechanism 17, whole-chain 0, precision 0, the reviewer's precision query 2,
composite-name 43 (every one already in the flexoelectric route's bundle) — and the reviewed record
`2026-09-21-route-thermopolarization-generator.yaml` with eight decided hits, inconclusive / partial
(Semantic Scholar and Scholar outstanding; Trepakov 1989 with the owner, exception e9d8).

Focus sent (1:04 pm): the search's result; two questions — whether the thermal polarization of polar
liquids (Bresme and successors, NEMD) is the same phenomenon, a sibling, or nothing until an
experiment exists, and whether any experiment has measured it; what Marvan & Fähnrich 1997 contains;
pass 33 confirmed as the open-primary measurement sweep, and where each plant datum should sit.
ChatGPT (High, ~6 min, with web search). Verdict: PIVOT — 23 findings.

Verification before recording: Marvan & Fähnrich 1997, Bresme et al. 2008, Armstrong & Bresme 2015,
Gittus, Albella & Bresme 2020, Máthé et al. 2022 and Wirnsberger et al. 2017 resolved on Crossref
and their abstracts read on OpenAlex — Marvan & Fähnrich's is explicit that the thermopolarization
contribution to the LIMM signal "was studied theoretically"; Bresme 2008 is NEMD of bulk water
(≈ 10⁶ V/m at 10⁸ K/m); Gittus 2020 gives S_TP ≈ −0.6 mV/K for acetonitrile; Máthé 2022 drives its
thermomotor with the pyroelectricity of an already ordered ferroelectric fluid. Lu 2024's full text
reached through the MDPI XML route from her logged-in tab: the 28 °C / 4 °C pair is the design point
(2.63 %, 50 kW), the experiment ran with the simulated seawater at 24–28 °C / 4–8 °C by the
conclusion (Figure 11 shows ≈ 27.5–30.5 °C / 4.5–7 °C over the run) and peaked at 47.4 kW (the
abstract says 47.5) and 2.46 %; Shaheed 2023's open PDF read (Al-Mosyab Unit 3 at 225 MW load:
539 °C / 152 bar main steam, 168 kg/s, 0.1 bar condenser, 24 °C cooling water; 39.3 % in Table 4,
39.91 % in the text, an EES energy balance of the readings); Al Mhanna 2024's Table 3 read (local
plant: 127 MW gas turbine, 61.5 MW steam turbine, 1050 °C inlet, 540.7 °C exhaust, 46.93 % — which
(127 + 61.5) MW over 9.2 kg/s × 43,662 kJ/kg reproduces exactly, so it is the combined cycle's).

## Applied

1. The polar liquid is the same phenomenon, spelled as a second claim (findings 2–8):
   `claim:temperature-drives-liquid-thermopolarization` (temperature gradient drives
   thermopolarization; `state-liquid` on the same medium region `dielectric` as the solid claim;
   relation `E_∥ = S_TP ∇T` in V/K; `regime_requires` the spatial gradient; status
   theoretically-predicted on Bresme 2008, Armstrong & Bresme 2015 and Gittus 2020). The
   phenomenon's summary widened and `state-solid` moved off its tags; the solid claim keeps its
   spelling and evidence and gains the same regime requirement.
2. The sink stays solid (finding 5): `claim:thermopolarization-produces-charge` now requires
   `state-solid` + `medium-dielectric` on region `dielectric`, so the ten routes the liquid claim
   enumerates (751 routes now) all leave the boundary check unresolved at the liquid → solid
   handoff — an interface the atlas will not record, because the liquid charge-collection claim it
   would stand for has no evidence. The reviewer's suggested region `polar-liquid` was not used:
   a different region name would have let the liquid spelling inherit the solid sink silently.
3. No experiment (findings 6–7): Máthé 2022 recorded as a source with the wrong-coupling ruling,
   named in the liquid claim's conditions; the negative is a web-search negative, stated as such.
4. Marvan & Fähnrich 1997 (findings 9–11): decision insufficient-information → theory-only in the
   reviewed record, access abstract, the limitation and conclusion rewritten; added as a source.
5. Pass 33 (findings 12–23) confirmed with corrections the full texts bear out: the OTEC design
   point as a model datum and the experiment as a laboratory datum without T_h / T_c; Al-Mosyab's
   readings as a plant datum under the operating-state names and its 39.3 % as a model-derived one;
   the gas turbine's 127 MW and two temperatures only, the 46.93 % kept off the pathway; all
   additive beside the summary efficiencies; Backhaus & Swift 2000 stays with the owner.

Result: revision 712c88528204 — 339 entities · 506 claims · 213 sources · 89 pathways · 751 routes ·
83 demonstrated · 13 reviewed searches · 84 regime pass · 114 unresolved · boundary 713 pass / 34
unresolved · 70/70 · axe clean · exports valid · live. Pass 33: the sweep's three records.
