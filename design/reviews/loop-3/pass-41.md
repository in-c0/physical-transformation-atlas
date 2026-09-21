# Pass 41 — the forced-advection / external-flow closure (21/09/2026 6:14–6:30 pm Sydney, build; message after)

Built on the reviewer's pass-40 order (findings 2–33): advection now machine-records the bulk fluid
motion it requires, the two pathways that have it record where it comes from, and the eight generic
advective routes say honestly that they do not.

## Built

1. The seventeenth regime token (finding 5): `flow:bulk-fluid-motion` — "nonzero bulk motion of the
   heat-carrying fluid through the region over which thermal enthalpy is transported" —
   `provider_needs_explanation: true`, in the registry and the served vocabulary.
2. `claim:temperature-drives-advective-heat-transport` requires both
   `thermal:spatial-temperature-gradient` and `flow:bulk-fluid-motion` (finding 6), never as
   `regime_external` (finding 7); the `flow-required` condition stays beside the regime (finding 11);
   the phenomenon summary in the reviewer's words — the fluid motion "must be established separately
   by an upstream flow process, buoyancy or an external circulation device such as a pump" (finding
   12); the thermal → thermal ledger unchanged (finding 13).
3. The PWR's reactor-coolant-pump auxiliary now `establishes: [flow:bulk-fluid-motion]` and the
   primary pathway supplies the token to its route through it (findings 8–9) — REGIME PASS for the
   right reason: the gradient from its source, the flow from its pumps.
4. `pathway:forced-circulation-heat-delivery` ("Forced-circulation heat-delivery loop", commercial,
   K8) on the advective suffix p-e6101d69e3 (findings 14–19): the three advective claims, a
   mechanical circulation-pump auxiliary establishing the flow token, evidence DOE-HDBK-1012/2-92
   (read on energy.gov: "the term forced convection is used if this motion and mixing is caused by
   an outside force, such as a pump … the transfer of heat from the surface of a heat exchanger to
   the bulk of a fluid being pumped through the heat exchanger is an example") and the NRC PWR page;
   no new transducer (finding 20); the route stays atomic / circular structurally — a transport
   subsystem, thermal in and thermal out — while demonstrated / commercial evidentially (finding
   21); conduction and advection stay distinct, uncollapsed (findings 22–23).
5. The ten advective routes recomputed (findings 25.5–25.6): the two pathways pass; the eight
   generic routes (combustion, Peltier, Ettingshausen, photothermal, radiative-cooling, two decay
   and fusion sources → advection → useful heat) read UNRESOLVED specifically on
   `flow:bulk-fluid-motion` with the gradient supplied; nothing obtains flow from the word "flow"
   in a tag, alias or carrier — the check reads regime tokens only, and no entity or claim provides
   the token by name (tested).
6. Controls in the suite (findings 26–29, 33): the negative control on all eight generic routes;
   the two positive controls with their electrical and mechanical pump auxiliaries; the
   provider-needs-explanation regression (the PWR's auxiliary cut from a copy with the provider kept
   → the loader refuses); the route count stayed 761 — no process edge added. 79/79.

Result: revision c24d8d754de3 — 343 entities · 510 claims · 222 sources · 92 pathways · 2 systems ·
761 routes · 86 demonstrated · 17 regime tokens · 79/79 · axe clean · exports valid · live.

## Reviewed (sent 6:31 pm; ChatGPT High, ~7 min, with web search; PIVOT — 40 findings)

1. The closure accepted (finding 1): a temperature gradient alone does not manufacture bulk flow;
   the two pumped implementations pass because their circulation machinery establishes it.
2. (B1) Of the fourteen `flow-required` claims only `claim:hot-gas-drives-mhd` needs the flow token
   (findings 2, 11, 16): flow-subject claims already have flow as their cause, pressure-driven
   claims generate flow rather than consuming it, and the waterwheel needs no generic prerequisite.
   Reuse `flow:bulk-fluid-motion`, no channel-flow synonym (finding 3). One correction to the
   pass-41 control: `disequilibrium:fluid-flow` should itself provide the token — an explicit
   ontology assertion like temperature-gradient → spatial gradient, not an inference from the word
   "flow" — so the invariant becomes "no entity other than fluid-flow provides it; no carrier or
   condition tag supplies it implicitly" (findings 4–5).
3. MHD needs a field regime too: an eighteenth token `field:transverse-magnetic-field` ("a nonzero
   magnetic-field component transverse to the electrically conducting fluid velocity in the active
   MHD region"), never `field:nonuniform-magnetic-field` (a generator does not need a spatial
   gradient), carried as `regime_external` on both MHD driving claims because the magnet is an
   independent externally imposed degree of freedom (findings 6–10). Combustion never provides bulk
   flow (finding 12). No invented `external-input` auxiliary on the combustion generator: open-cycle
   channel flow is created by the generator's own gas-dynamic expansion, so the pathway goes REGIME
   UNRESOLVED until a reviewed source establishes how the exact pathway creates the channel velocity
   and the schema can record that provider truthfully — a limitation for the backlog, not for this
   pass (findings 13–15).
4. (B2) No "transport pathway" class (finding 17). The defect is the word `circular` and its label
   "round trip": same energy form at the two ends says nothing about anything returning to a
   starting state; rename the class `same-form`, label "same energy form" (findings 18–20, 23). And
   the exact commercial route must compile to `atomic` / `demonstrated` / `demonstrated`, asserted
   in a regression (findings 21–22). Close findings 4–22 inside pass 41 (finding 24).
5. (B3) Pass 42 is a hybrid, (a) preferred with (b) as a typed escape hatch (findings 25–40): never
   a `bounded_by` claim per pathway (a pathway is a composition record, not an ontology entity);
   prose that repeats a bound already reachable through the route's typed graph is deleted; a
   generic bound missing from the graph becomes a constraint entity plus a `bounded_by` claim on the
   right phenomenon with evidence; a bound valid only for the exact reviewed architecture becomes a
   typed `Pathway.bounds[]` entry `{ constraint, evidence[], conditions[], note }` restricted to
   `upper-bound` | `formula-bound` constraints; the bound check merges and deduplicates the two
   sources through the same applicability / metric / basis machinery; a loader rule rejects a
   pathway bound already reachable from its route entities; every remaining row gets exactly one
   disposition (already-typed → delete; generic-bound-missing → constraint + claim;
   pathway-specific-bound → `bounds` reference; benchmark / resource / projection / not-a-bound →
   its typed representation or removal); then `theoretical_limit` leaves the schema, the route page,
   the coverage code and the API documentation. Two regressions: bound results unchanged after
   every prose row is removed (a change marks a limit that lived only in prose); a synthetic
   architecture-specific constraint referenced only from `Pathway.bounds` evaluates on that pathway
   and never on a sibling route sharing the phenomenon. Start with a generated map
   `pathway | old text | typed constraint reachable? | proposed constraint | class | evidence`.
   Source restoration returns after pass 42 as typed measurements only.

## Closed (6:38–6:58 pm; findings 4–23 applied, live at rca0172056e74)

- `disequilibrium:fluid-flow` carries `regime_provides: [flow:bulk-fluid-motion]`; the loader's
  self-certification map gains `flow → kinetic` so a kinetic subject can never carry the token as
  `regime_external`.
- Eighteenth token `field:transverse-magnetic-field` in the registry and the served vocabulary.
  `claim:flow-drives-mhd` requires it (external); `claim:hot-gas-drives-mhd` requires it (external)
  and `flow:bulk-fluid-motion`. Two open NASA sources read in full and cited: the Lewis tech
  preview ("a hot high-speed conducting gas flows through a magnetic field. As a result of this
  motion, a voltage is induced") and Smith's NASA TM-79135 (cesium-seeded H₂–O₂ combustion products
  through a nozzle "designed for Mach 2" into a diverging duct of 42 electrodes in a 5 T
  cryomagnet; power ∝ B²; 8.74 → 11.7 kW when the takeoff moved downstream).
- `pathway:mhd-generator` keeps no auxiliary and no provider: its route p-d7374879fd reads REGIME
  UNRESOLVED on `flow:bulk-fluid-motion` with the transverse field supplied; the pathway text and
  a documented exception in the frontier suite say why (the channel velocity is the combustor's own
  nozzle expansion — a provider kind the schema cannot yet name). The three flow-driven MHD routes
  pass.
- Frontier class `circular` → `same-form` in the schema, compiler, vocabulary ("… this says nothing
  about whether matter, energy or state returns to its starting condition"), UI label ("same energy
  form"), drawer and frontier copy, and the docs (status model, candidate generation, ontology);
  recorded in the format history as a rename with its reason. 99 routes carry it; none demonstrated.
- The compiler no longer writes `composition` onto a recorded pathway whose route has one
  conversion phenomenon: 42 of the 92 recorded pathways are now `atomic` (one effect plus
  bookkeeping), as the served definition of `composition` ("two or more conversion phenomena") always
  said; a recorded pathway is still never dominated. p-e6101d69e3 asserts `atomic` / `demonstrated` /
  `demonstrated`. My pass-41 message had called the route "atomic / circular" — that was the pass-40
  state of the unrecorded suffix, not the compiled state of the recorded pathway (composition /
  demonstrated / demonstrated at rc24d8d754de3); corrected to the reviewer in the pass-42 message.
- Counts unchanged: 761 routes · 86 demonstrated · 224 sources · 18 tokens · 79/79 · axe clean ·
  exports valid · both audit gates consistent.
