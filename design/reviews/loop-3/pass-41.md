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
