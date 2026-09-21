# Pass 33 — the open-primary measurement sweep; a model datum never decides a route's bound (21/09/2026 1:27–1:58 pm Sydney)

Records first (0856be3, live 8279724255a8 before the message went out, 1:37 pm): the three full
texts read — Lu 2024 through MDPI's article XML from the owner's logged-in tab, Shaheed 2023 from
IIETA's open PDF, Al Mhanna 2024 likewise from MDPI — and recorded as structured measurements,
additive beside the summary efficiencies: OTEC's 28 °C / 4 °C design point as a model datum
(2.63 %, T_h_K 301.15 / T_c_K 277.15) and its experiment as laboratory data (2.46 %; 47.4 kW
maximum grid-connected power — 47.5 in the abstract) with no temperature pair, because the paper
prints none for that operating point (Figure 11's ≈ 30 °C / ≈ 6.3 °C at peak power is a graphical
reading, kept in the note); Al-Mosyab Unit 3's 225 MW readings as a plant datum under
`T_turbine_inlet_K` 812.15 and `T_cooling_water_inlet_K` 297.15 and its 39.3 % EES efficiency as a
model-derived datum; the Omani plant's 127 MW gas turbine at 1050 °C / 540.7 °C, the 46.93 % kept
off the pathway as the combined cycle's — (127 + 61.5) MW over 9.2 kg/s × 43,662 kJ/kg reproduces it
exactly. Backhaus & Swift 2000 filed to the owner as exception dc26.

Focus sent (1:41 pm): the sweep as recorded and what the texts changed; three rulings — whether a
model-scope datum may make the Carnot check pass (the OTEC design point had), which of Shaheed's
three efficiencies to keep, and whether the atlas should spell cascaded / bottoming cycles at all.
ChatGPT (High, ~7 min, with web search). Verdict: PIVOT — 27 findings.

## Applied

1. The same-region choice of pass 32 upheld (findings 1–2): both claims describe the same
   thermopolarizing medium; a region split would have let an unsupported liquid → solid charge
   collection pass; no interface is recorded for the ten liquid routes.
2. The bound rule (findings 3–8): `checkThermodynamicBound` now evaluates every comparable datum but
   lets only physical-scope data (laboratory, device, module, system, plant, field, or a summary
   efficiency) decide the route; a `model` datum is reported as *model-consistent* or
   *model-inconsistent* and a model above the bound marks the model, never the route. OTEC returns
   to unresolved with the calculation preserved in its detail ("model-consistent · … 2.63% ≤ Carnot
   limit (8.0%) at T_h_K 301.15 / T_c_K 277.15; no comparable physical datum …"). Regression: a
   physical 3 % at 300 / 280 K passes, the identical model datum is unresolved and model-consistent,
   a model 50 % is unresolved and model-inconsistent, never a fail. Definition, /methods and
   docs/data-api.md updated. 71/71.
3. Shaheed's 39.3 % kept at scope model with the reviewer's exact discrepancy note (findings 9–11).
4. Pass 34 set (findings 12–26): the branched / cascaded system layer — `SystemPathway` with
   members `{id, pathway, role}`, `SystemHandoff` (from/to member, energy form, `to_source`,
   carrier, kind residual-energy | recovered-heat | mechanical-coupling | electrical-coupling |
   material-flow, conditions, evidence, status), outputs with `aggregation`, performance; routes and
   pathways stay one linear chain each; the eight checks are not run over a system yet; first record
   `system-pathway:natural-gas-combined-cycle` carrying the 46.93 %; two data defects first — the
   gas-turbine pathway's `demonstrated_with` points at the Rankine plant transducer, and its
   `efficiency_record: 0.64` is the combined cycle's (its own limit text says so) — plus the
   turbine-inlet "Carnot" prose rewritten. Pass 35: the legacy generic-performance sweep.

Result: revision 2939c4ae8a93 — 339 entities · 506 claims · 216 sources · 89 pathways · 751 routes ·
83 demonstrated · thermodynamic bound 1 pass / 531 unresolved / 219 unknown · 71/71 · axe clean ·
exports valid · live.
