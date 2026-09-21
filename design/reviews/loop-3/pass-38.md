# Pass 38 — the steam / nuclear heat-engine architecture audit (21/09/2026 4:48–4:57 pm Sydney, build; message after)

Built on the reviewer's pass-37 order (findings 16–34): the causal-representation defect in the
nuclear plant — fission → hot gas → turbine expansion, which is not architecture-neutral — closed
with the claims the atlas already had, and the steam engine named for the architecture its
evidence establishes.

## Built

1. Sources: the NRC's own descriptions of the two commercial light-water topologies, read in the
   owner's Chrome — the BWR ("a steam-water mixture is produced when very pure water (reactor
   coolant) moves upward through the core … the steamline directs the steam to the main turbine")
   and the PWR ("pressurized water in the primary coolant loop carries the heat to the steam
   generator. Inside the steam generator, heat from the primary coolant loop vaporizes the water in
   a secondary loop").
2. `claim:fission-produces-hot-gas` narrowed (findings 20–22): fission heating produces a vapour or
   gas working fluid in a DIRECTLY heated, same-circuit configuration — the reactor coolant boiling
   in the vessel (a BWR) or a fissioning / fission-heated gas as the working medium (a gas-core
   reactor); the PWR removed from its conditions, with the sentence that a heat exchanger, not the
   core, makes that turbine's steam and that the two-circuit topology belongs to the system layer.
   The claim stays available to the gas-core MHD and nuclear-light-bulb routes searched in passes
   29–32 (tested: both search records still target their routes).
3. `pathway:nuclear-steam-plant` re-spelled (findings 23–27): binding-drives-fission →
   fission-produces-gradient → expansion-drives → expansion-produces-motion → motion-drives-generator
   → generator-produces-carriers → charge-carriers-convert-electricity — nuclear heat establishes a
   thermal disequilibrium that a steam Rankine cycle converts; no new synonymous nuclear-heating
   edge. The pathway attaches to the already enumerated route p-927c9d0147 (it had read "derived"),
   which now passes the regime check through the spatial gradient; the route it left, p-dc7d860e03
   (through hot gas and the turbine step), stays enumerated as a derived, undemonstrated route
   unresolved on the pressure drop — so the count is 751 before and after and the pass-36 exception
   list is empty (no demonstrated route unresolved). No nuclear feed-pump auxiliary (finding 29); the
   PWR's primary → secondary heat handoff is the system layer's business (finding 28).
4. `pathway:steam-engine` renamed "Steam Rankine cycle (shaft work)" (findings 30–33): its evidence
   establishes a Rankine steam-turbine cycle, not the generic reciprocating class; the id stays; a
   reciprocating engine gets its own pathway and transducer if the atlas ever sources one.
5. Regressions (finding 34), all in the suite: no PWR wording qualifies the direct-carrier claim;
   the generic nuclear plant runs fission-produces-gradient → expansion-drives and passes the regime
   check; fission → hot gas remains enumerable for the MHD and thermal-emission routes and the two
   fission search records still target them; the steam engine carries its Rankine name; 751 routes,
   83 demonstrated. 77/77.

Result: revision 94a560d72b62 — 340 entities · 507 claims · 220 sources · 89 pathways · 1 system ·
751 routes · regime 111 pass · 119 unresolved · 521 unknown · 77/77 · axe clean · exports valid · live.

## Reviewed (sent 4:59 pm; ChatGPT High, ~8 min, with web search; PIVOT — 31 findings) and applied (5:07–5:14 pm)

1. The re-spelling accepted (finding 1); two distinct spellings kept distinct (finding 9).
2. The BWR recorded (findings 2–8): `pathway:boiling-water-reactor-direct-steam-plant`, commercial,
   K8, on the direct-steam route p-dc7d860e03 the generic plant left — `transducer:boiling-water-
   reactor-plant` (the coolant boils in the vessel and the same circuit drives the turbine) with
   `claim:fission-implemented-bwr` (status demonstrated: one primary, the regulator's description);
   `regime_provides` the expansion pressure drop, explained by an `external-input` auxiliary
   (electrical; condensate / feedwater pumping and cycle-pressure restoration; the NRC's "pumped
   out of the condenser with a series of pumps, reheated, and pumped back to the reactor vessel",
   "cooled by water circulated using electrically powered pumps") — not recirculating-work, because
   the generic description does not say whether a unit's feed pumps are turbine- or motor-driven.
   The route now surfaces demonstrated / commercial and passes the regime check only through the
   BWR provider; the generic fission → hot gas → expansion routes without a pathway stay unresolved
   (tested). 84 demonstrated routes, 751 enumerated.
3. Backlog set (findings 10–18, 31): pass 40 = the PWR as a system — `pathway:pwr-primary-heat-
   delivery` (fission → gradient → heat conduction → heat flow → useful heat), `output:useful-heat`
   clarified as thermal energy delivered across a boundary at a useful temperature, a new handoff
   kind `transferred-heat`, the handoff primary → secondary with `carrier: null`, a loader invariant
   that `from_energy_form` equals the sending member's terminal energy form, and internally consumed
   member outputs omitted from the system's outputs.
4. Pass 39 set (findings 19–30): the retained-assertion sweep in closure order — photosynthesis
   (Blankenship 2011 open in the UC repository: ≈ 12 % theoretical glucose limit, 4.6 / 6.0 %
   physiology-limited maxima, 3.5 / 4.3 % short-term reported — so 0.045 goes unless another
   source; the ≈ 12 % kept with its basis), rectenna (Brown's 1977 NASA CR-135194 on NTRS: the
   90.6 % only if bound to the 2.45 GHz element with its basis), fuel cell (DOE: ~60 % PEM, 65 % a
   target or an MCFC hybrid — remove unless a named device), wind (0.52 is a rotor C_p, wrong
   quantity — remove), hydro (95 % is hydraulic turbine efficiency, not water-to-wire — remove),
   betavoltaic (Tarelkin's 6 % is an e-beam proxy — remove unless an isotope device), the four
   limit rows (solar-water-heater ~0.9 out; PEC ≈ 30 % needs its model; photosynthesis kept; TPV
   "> 50 % projected" out of the limit field); end state zero writable `efficiency_record`, the key
   retired like the others.

Result: revision 5f971ff53622 — 341 entities · 508 claims · 220 sources · 90 pathways · 1 system ·
751 routes · 84 demonstrated · 77/77 · axe clean · exports valid · live.
