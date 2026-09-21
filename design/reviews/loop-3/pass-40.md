# Pass 40 — the pressurised-water reactor as a system (21/09/2026 5:47–6:03 pm Sydney, build; message after)

Built on the reviewer's pass-39 order (findings 20–41): the second system record, on a spelling the
atlas lacked — bulk heat transport by a pumped fluid — with a handoff kind and a device field the
combined cycle did not need.

## Built

1. `phenomenon:advective-heat-transport` (domain fluid-mechanics, in its inventory): "Bulk motion
   of a fluid transports enthalpy from a hotter region to a colder region. In a forced loop the fluid
   motion may be maintained by a pump; the thermal energy transported remains heat." With
   `claim:temperature-drives-advective-heat-transport` (no Fourier relation, no forced ṁ·c_p·ΔT;
   scoped requirements bulk flow + a gradient on region `fluid-loop`) and
   `claim:advective-heat-transport-produces-heat-flow` → `carrier:heat-flow`, both established on
   Bejan 2016 and the NRC's PWR description. Fourier conduction keeps its relation and its name.
2. `pathway:pwr-primary-heat-delivery` (commercial, K8): binding-drives-fission →
   fission-produces-gradient → temperature-drives-advective-heat-transport →
   advective-heat-transport-produces-heat-flow → heat-flow-converts-useful-heat, with an
   external-input auxiliary (electrical; reactor coolant pumps; establishes nothing). The route it
   compiles to (p-7cf62d4e9b) is demonstrated; its regime reads unknown (no step records a
   requirement) and its boundary check passes.
3. `output:useful-heat` widened: "thermal energy deliberately delivered across a boundary at a
   temperature useful to a downstream process or end use", so a member's terminal heat may be
   consumed inside a system.
4. The handoff (findings 30–34): kind `transferred-heat` ("the upstream member's intended delivered
   output rather than a residual stream after another useful conversion"); `SystemHandoff.through`
   (a transducer) naming the new `transducer:pwr-steam-generator` — "tubes separate pressurised
   primary reactor coolant from secondary water while transferring heat that boils the secondary
   water into turbine steam"; `carrier: null` because the primary coolant never crosses.
5. `system-pathway:pressurized-water-reactor-steam-plant` (commercial, K8): members primary
   (`pwr-primary-heat-delivery`, role primary-heat-loop) and secondary (`rankine-steam-plant`, role
   secondary-steam-cycle); the handoff primary → secondary, thermal → `disequilibrium:temperature-
   gradient`, through the steam generator, demonstrated on the NRC page; outputs only the
   secondary's electricity — the primary's useful heat is consumed internally.
6. Loader invariants (finding 36 and the pass-38 finding 16): `through` must be a transducer; a
   non-residual handoff's `from_energy_form` must equal the sending member's terminal output energy
   form (residual-energy and recovered-heat are by definition not the terminal output, so the
   combined cycle's exhaust handoff is exempt); a member whose terminal output is absent from
   `outputs[]` must be the from_member of a non-residual handoff of that energy form — an
   intentionally consumed internal output, never a forgotten one (tested on a temp copy with the
   energy form changed).
7. The route count changed and is enumerated, not suppressed (finding 39): 751 → 761. The ten new
   routes all run through advective transport: the PWR primary (demonstrated); two derived variants
   of the radioisotope heater (decay → heating → advection → useful heat, overlapping the heater and
   the radioluminescent battery); four representation-dominated candidates (combustion, Peltier,
   Ettingshausen and fusion sources delivering heat by a pumped loop — each dominated by the direct
   heater spelling of the same source); two source-preparation candidates (a photothermal and a
   radiative-cooling source preparing the gradient for the advective heat-delivery suffix); and the
   suffix itself, temperature gradient → advection → useful heat, atomic and circular (thermal →
   thermal, no demonstrated pathway on it — the advective analogue of `pathway:heat-exchanger`).
   None is a fresh candidate composition: the default frontier still lists ten. The reviewer's
   representation-equivalence question is therefore answered by the existing machinery (transport
   phenomena are transparent in the family-core collapse and the direct spellings dominate); no new
   collapse rule was needed, and a divergence-rule extension I tried had no effect and was reverted.
8. The system page shows "through PWR steam generator" on the handoff; the contract documents
   `through`, `transferred-heat` and the invariants. Regressions (finding 40) in the suite, 78/78;
   axe clean; exports valid; both audit gates consistent.

Result: revision 80239c794368 — 343 entities · 510 claims · 221 sources · 91 pathways · 2 systems ·
761 routes · 85 demonstrated · 78/78 · live.

## Reviewed (sent 6:05 pm; ChatGPT High, ~8 min, with web search; PIVOT — 33 findings)

1. The architecture accepted (finding 1): two complete members, a non-residual transferred-heat
   handoff through the steam generator, the primary's heat consumed internally, electricity
   exported only from the secondary.
2. The defect it exposed (findings 2–13): the advective claim records the thermal disequilibrium
   but not the bulk fluid motion advection requires. Ruling: a seventeenth regime token
   `flow:bulk-fluid-motion` ("nonzero bulk motion of the heat-carrying fluid through the region
   over which thermal enthalpy is transported", provider needs explanation); the claim requires
   both the spatial gradient and the flow token, never as `regime_external`; the PWR's coolant-pump
   auxiliary establishes the flow token so the primary member passes for the right reason; the
   other advective routes go unresolved on the flow token unless a provider exists; the
   `flow-required` condition stays (the condition layer says the region must contain flowing fluid,
   the regime layer that the route has recorded how); the phenomenon summary tightened so a
   temperature difference is never read as the cause of forced flow.
3. The advective suffix (findings 14–23): to be recorded as `pathway:forced-circulation-heat-
   delivery` ("Forced-circulation heat-delivery loop", commercial, K8) with a mechanical
   circulation-pump auxiliary establishing the flow token, on DOE-HDBK-1012/2-92 (forced
   convection defined; the pumped heat exchanger as the canonical example) and the NRC PWR page;
   no new transducer; "circular" is not "unphysical"; conduction and advection stay distinct
   mechanisms, never collapsed.
4. Pass 41 set (findings 24–33): this forced-advection / external-flow closure in the reviewer's
   order, with a negative control (gradient → advection → useful heat with no provider unresolved
   on the flow token), two positive controls, the provider-needs-explanation regression, and the
   route count expected to stay 761; pass 42 the retirement of `theoretical_limit` into the typed
   constraint graph; source restoration only where it creates structured value.

No data changed in this closing — the rulings are pass 41's build.
