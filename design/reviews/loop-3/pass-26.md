# Pass 26 — scoped conditions and interface records: where the medium changes, name the boundary (21/09/2026 2:18–2:55 am Sydney)

Focus sent: the deferred region-scoped-condition pass, taken while every search engine is closed
(OpenAlex's budget resets at 10:00 am Sydney). (A) two lane decisions to confirm — the magnitude
screen asking only relation-capable steps for a relation; the Zheng 2022 thermoacoustic piezoelectric
harvester recorded as a demonstrated pathway; (B) the problem: the boundary check inherited entity
tags into every step and flagged 87 routes with an "implied interface", among them two demonstrated
pathways (the PAN membrane in the engine's sound field; the MHD generator, whose charge-carrier
entity was tagged state-solid); (C) a proposal to react to — three condition scopes, an Interface
record on a claim pair, a compiler rule, four first records; (D) pass 27. ChatGPT (High, ~4 min).
Verdict: PIVOT — 29 findings.

Verification before recording: Rosa 1961 (Physics of Fluids 4:182–194, DOI 10.1063/1.1724426) was
already `source:rosa-1961-mhd`; the two acoustic-impedance figures in the theoretical record's note
are the pass-25 estimate re-derived (30-bar helium ≈ 4.9 × 10³ Pa·s/m, germanium ≈ 2.9 × 10⁷, T_I ≈
7 × 10⁻⁴) and stay an illustration; every one of the 113 old conflict occurrences was re-classified by
a script against the pass-25 live export, not by hand (`pass-26-interface-migration.md`).

## Applied

1. Confirmed (findings 1, 3): the relation-capable-steps rule stays; the Zheng pathway stays and
   rises to K6 (a working transducer: 30 LEDs, a battery charged, from the engine).
2. Renamed (finding 2): magnitude-screen `bounded` → `relation-complete` — "every relation-required
   conversion step carries a dimensionally valid constitutive relation; no route magnitude is thereby
   asserted". The value had been live for one revision. Documented as a rename in the data-api
   format note; vocabulary block `path.magnitude_screen.status` added.
3. Scoped conditions (findings 4–7): `condition_requirements[] = { tag, scope, region }` on claims
   (medium / boundary / environment; region a slug, `active` by default); every ontology tag carries
   a `default_scope`; a claim's flat tags expand with the defaults when it has not been curated, and
   the export always carries the effective requirements. Entity-level tags are descriptive and never
   inherited. Two requirements conflict only in the same scope on the same region — a listed pair, or
   two members of an exclusive group; environment requirements are compared route-wide; boundary
   requirements are checked against interface records, never as medium states.
4. The conflict ontology (findings 19–25): two exclusive groups — material state (solid / liquid /
   gas / plasma) and temperature regime (cryogenic / room / high) — replace the state and temperature
   rows; the Curie-point rows, the vacuum-versus-liquid rows and the plasma-versus-water row are
   removed (material limits and cross-region facts, not incompatibilities); two universal same-region
   rows remain (cryogenic × aqueous, high-temperature × aqueous).
5. Interface records (findings 8–13): the `Interface` schema exactly as specified (location
   between_claims or within_claim; nine kinds; a transmission relation in the atlas's relation form;
   status demonstrated / theoretical / proposed), loaded from `data/canonical/interfaces`, validated
   (claims, sources, carrier, tags, relation quantities; a demonstrated record must cite evidence),
   served in graph.json. The boundary check now returns FAIL (a same-scope, same-region conflict inside
   one step, or environment conflicts anywhere), PASS (every adjacent medium transition has a
   demonstrated record), UNRESOLVED (a transition unrecorded, or only theoretical / proposed), UNKNOWN
   (no scoped requirements). Routes gain `interfaces_recorded[]` and `interface_model_coverage`;
   `implied_interface_count` counts only unrecorded transitions. The frontier line reads "BOUNDARY
   compatible · 1 recorded interface" / "BOUNDARY unresolved · 1 theoretical interface" / "… 1
   interface unrecorded"; the route page lists each record with its regions, carrier, token, relation,
   conditions, notes and evidence. Interface relations stay outside the magnitude screen.
6. Data (findings 14–17): `interface:thermoacoustic-pan-membrane` (demonstrated, Zheng 2022),
   `interface:mhd-plasma-electrodes` (within `claim:mhd-produces`, demonstrated, Rosa 1961),
   `interface:thermoacoustic-acoustoelectric-gas-solid` (theoretical, with the plane-boundary
   transmission relation and the token acoustic:travelling-wave); `carrier:charge-carriers` made
   phase-neutral (its state-solid tag had manufactured a gas–solid interface on every MHD route);
   `claim:thermoacoustic-produces-sound` states its own medium (state-gas) so a solid consumer is a
   real transition; `quantity:acoustic-impedance` added.
7. The migration audit (finding 29), generated: of the 113 old conflict occurrences on 87 routes —
   49 false entity-inheritance conflicts, 22 same-region transitions still unrecorded (the
   generic-sound → acoustoelectric spelling, and travelling-sound → piezoelectric), 20 removed rows,
   11 resolved by the demonstrated PAN record, 11 recorded as theoretical. Boundary results now: 860
   pass · 33 unresolved · 14 unknown; 22 routes carry an unrecorded transition, 27 a recorded
   interface. Every demonstrated pathway is boundary-pass except three that record no condition tags
   at all (heat exchanger, incandescent lamp, passive radiative cooler — unknown, nothing inferred);
   none shows an anonymous implied interface.
8. Tests (findings 26–27): the synthetic boundary test covers scope, region, the exclusive group,
   an unrecorded transition, a demonstrated record and a theoretical one; the frontier test covers
   the PAN pathway, the MHD generator, the candidate and the generic spelling, and asserts no
   demonstrated pathway carries an unrecorded interface. 66/66.

Not done, deliberately: no claim yet declares an explicit region other than `active` (the "no longer
conflict after region separation" disposition is empty), and a temperature gradient handed from a
flame or a reactor to a solid converter (a heat-exchanger wall) is not recorded as an interface — the
producing steps have no own medium tag, so those 49 cases are false-inheritance conflicts under the
reviewer's rule; whether demonstrated combustion- and reactor-heated converters should carry a
heat-exchanger-wall record is the next question for the reviewer.

Result: revision 12f9f0b568ca — 497 claims · 192 sources · 87 pathways · 907 routes · 81 demonstrated
· 8 reviewed searches · 3 interface records · 10 candidate compositions · 66/66 · axe clean · exports
valid · live. Pass 27 (finding 28): the OpenAlex runs when the budget resets — p-231472e45e, then the
thermoflexoelectric rerun for p-a093d7ecc5; P3 as pass 28.
