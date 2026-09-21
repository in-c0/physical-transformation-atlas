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
