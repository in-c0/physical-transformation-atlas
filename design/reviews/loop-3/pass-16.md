# Pass 16 — the frontier's thirteen candidate compositions, audited as physics (20/09/2026 ~7:40–9:35 pm Sydney)

Focus sent: the thirteen routes the default frontier presented as candidate compositions, each with
its claims, tags, ledgers, counters and handoff issues, and for each a verdict from GENUINE / KNOWN
DEVICE (with one citable primary source) / ARTEFACT (with the structural rule that should have
caught it) / BLOCKED (with the order-of-magnitude estimate); plus the handoff vocabulary, whether
heat conduction → phonon drag is a composition at all, and which route to search first. ChatGPT
(High, ~13 min, same chat). Verdict: PIVOT — 17 findings.

Verification before anything was recorded: all nine DOIs resolved on Crossref with matching titles,
authors and venues; every quoted figure was found in the abstract (Maggi 300 r.p.m.; Yang 140 μW at
1500 kΩ, 1.43 mW cm⁻³; Mozumder 1.28 V, ≈ 20 mW per wave event; Chiolerio 10.4 μW/K; Zhou 2.1
rad/min; Yalamarthy 32 %/88 %) or the full text (Frenkel 1.6 mV across 35 Ω, PMC6751999); Pini 2015
confirmed theoretical/numerical only. Two figures the reviewer quoted were *not* found and were not
recorded: Chiolerio "operating from ΔT = 1.25 K" and Zhao's "25.48 pW per channel" is recorded only
as a calculated, not measured, number.

## Verdicts and what was done

| route | reviewer | applied |
|---|---|---|
| Marangoni → flow → lift → motion → work (×2 drivers) and → induction | ARTEFACT | new `claim:marangoni-produces-motion` (replicated: Maggi 2015 thermocapillary gears, Frenkel 2019 solutocapillary rotor); pathways `thermocapillary-micromotor`, `marangoni-rotor`, `marangoni-rotor-generator`; the lift spellings are now representation-dominated by the direct routes (carrier-relay bypass) and, lacking `flow:bulk` + directed momentum, incomplete-handoff |
| Marangoni → flow → streaming (thermal, surface) | GENUINE | `surface:charged` removed from the handoff vocabulary and made the boundary tag `charged-surface-required`; Pini 2015 recorded as two **proposed** pathways (thermocapillary / solutocapillary streaming generator) that name the proposal without changing the class; first queries recorded here for the next search pass |
| thermo-osmosis → streaming | KNOWN DEVICE | pathway `thermo-driven-nanofluidic-converter` (Zhao 2020; 14 nA at ΔT 47.5 °C, power calculated not measured) — demonstrated |
| thermomagnetic → flow → lift → motion → induction | ARTEFACT | new `claim:ferrofluid-convection-couples-induction` (Chiolerio 2020) + pathway `thermomagnetic-hydrodynamic-harvester` (prototype, 10.4 μW/K); the lift spelling is representation-dominated by it and derived from the Zhou engine |
| thermomagnetic → flow → lift → motion → work | ARTEFACT (direct claim proposed) | **deviation**: Zhou's rotor sits in the circulating fluid, so the engine is recorded on the existing flow-to-rotor spelling as pathway `thermomagnetic-fluid-engine` (2.1 rad/min), with the ferrofluid flow now providing `flow:directed-momentum`; no duplicate direct claim |
| thermomagnetic → flow → streaming | GENUINE | boundary correction as above; stays a candidate |
| heat conduction → phonons → phonon drag → carriers | ARTEFACT | family-core normalisation: no-family transport phenomena are transparent, recorded pathways join the groups and are chosen by shared sources — the route is representation-equivalent to the thermoelectric generator (not the Nernst generator); Yalamarthy 2019 cited on `claim:phonon-drag-drives` |
| pressure → elastic → piezo | KNOWN DEVICE | pathway `pneumatic-pressure-piezo-harvester` (Yang 2022; prototype) |
| wave → pressure → elastic → piezo | KNOWN DEVICE | pathway `wave-impact-piezo-harvester` (Mozumder & Banik 2026; demonstrated, one lab result in a small venue, said so) |
| radiation pressure → motion → induction | BLOCKED | `motion:relative-flux-change` required by `motion-drives-induction` and `motion-drives-generator`, provided by every loadable motion producer (rotors, oscillators, engines) but not by radiation-pressure motion → incomplete-handoff; `constraint:radiation-momentum-flux` (p = I/c … 2I/c; ≈ 7 × 10⁻⁷ W m⁻² in sunlight at 0.1 m s⁻¹) as a `bounded_by` claim scoped by irradiance, not a prohibition |

Rules (findings 14–16), all as data-driven code with tests:

- `frontier_class: incomplete-handoff` — candidate-quality routes with an unresolved carrier
  contract leave the candidate class instead of ranking lower; matrix bridges exclude it.
- Proposed pathways attach to their exact route (shown on the route page and frontier row) but are
  ignored for overlap and never make a route demonstrated or derived — which also corrected the
  TOEC route from "derived" to "candidate (proposed)".
- The claim-level "derived" rule was tightened while implementing the above: two shared ordered
  claims now count only as a shared head, the whole pathway, or a span of two phenomena, so a shared
  generic tail (carrier → rotor → work) no longer makes a route "extend" an unrelated engine.
- Carrier-relay bypass extends representation-dominated; no-family normalisation extends the
  family-core collapse; a recorded pathway is never marked dominated.
- Handoff vocabulary: `flow:loadable-momentum` → `flow:directed-momentum`; `flow:magnetized`;
  `motion:relative-flux-change`; `surface:charged` deleted (boundary tag instead); thermo-osmosis
  provides `flow:bulk` + directed momentum on Straub 2016's measured hydraulic power.

Result: 13 → 5 candidate compositions (two Marangoni streaming generators with Pini's proposal
attached, the TOEC proposal, a resonant flexoelectric harvester and a vibration-driven elastocaloric
cooler that surfaced once generic-tail overlap stopped counting as derivation); 33 routes
incomplete-handoff; 8 new pathways (76 named), 8 sources (164), 17 claims (472), 7 transducers and
one constraint (320 entities); 742 routes, 73 demonstrated. Revision r491f992e7a77. 50/50 tests,
axe clean, exports valid, live.

Search order for the next search pass, as recommended: p-423a19acdd (thermocapillary → streaming)
first with the query `("thermocapillary" OR "thermal Marangoni") AND ("streaming potential" OR
"streaming current") AND (experiment OR measured)` under `streaming-potential`; then p-41cb505083
(solutocapillary); then p-1043a15e01 (thermomagnetic convection → streaming).
