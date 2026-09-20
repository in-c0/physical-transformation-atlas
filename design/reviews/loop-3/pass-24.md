# Pass 24 — the thermal expansion → flexoelectric route: observed but not converted (21/09/2026 ~12:55–2:05 am Sydney)

Focus sent: (A) the route-search-v1 plan and runs for p-a093d7ecc5 (aliases added first; OpenAlex
driver-mechanism 2,185 reported / 150 screened, mechanism-pair 8, whole-chain 0, precision 0; chases
on Zubko, Catalan & Tagantsev 2013 and Tagantsev 1986; Google Scholar captcha-blocked, Semantic
Scholar keyless; record inconclusive / partial); (B) arXiv:2605.17224 read in full — the
thermopolarization preprint — and the lane's decision sink-variant, with the nine other hits;
(C) five questions: sink-variant or constituent-only; how to represent a composition observed but
not converted (a new pathway status `observed`, a proposed pathway with notes, or nothing beyond the
record); any loaded thermal-flexoelectric device with one primary source; missing composite names
for the term bundle; pass 25. ChatGPT (High, ~6 min, with web search). Verdict: PIVOT — 18 findings.

Verification before recording: the three works the reviewer named were resolved on Crossref and
OpenAlex and read at abstract level — Han et al. 2026 (Adv. Funct. Mater. 36:e75910, abstract on the
publisher's page: a heterojunction flexoelectric nanogenerator driven by light and heat, differential
thermal deformation supplying the strain gradient, an effective pyroelectric coefficient of
7518 μC m⁻² K⁻¹; current responses, no load in the accessible record; full text paywalled), Wei et al.
2024 (J. Appl. Phys. 136:045703, hybrid OA: defines the thermoflexoelectric effect — temperature
gradients generate inhomogeneous strains that induce flexoelectric polarization — in a PN-junction
model; theory) and Yurkov, Dejneka & Yudin 2019 (Int. J. Solids Struct. 162:96–104, open archive on
ScienceDirect: a variational theory of an inhomogeneously heated plate with a calculated waste-heat
bound of tens of watts per kilogram; theory). OpenAlex's shared anonymous daily budget ran out
during the pass (HTTP 429 "Insufficient budget", resets at midnight UTC = 10:00 am Sydney), so the
thermoflexoelectric rerun the reviewer asked for is pending, not done.

## Applied

1. Decision (finding 1): sink-variant stands for Iwakiri, Miyata & Mori 2026 — the driver and both
   mechanisms in order are physically present, the sink is a measured polarization and its
   displacement current, and the route's `output:electricity` means delivered work (rule 4 does not
   qualify it).
2. Representation (findings 2–5): pathway status `observed` added to the schema with the reviewer's
   definition, plus the guard `observed_through` (required iff observed; one of the steps; never the
   final one). The compiler's demonstrated set is now `[demonstrated, prototype, commercial]`
   (`isDemonstratedPathway`), so `observed` behaves like `proposed` for the demonstrated class and for
   derived overlap, and the exact route carries `composition_observation: observed-not-converted`.
   The frontier row leads with OBSERVED · OUTPUT NOT DELIVERED (the compiler class stays in the row
   body and the title), then "search incomplete"; the route page spells out which step the evidence
   established. Vocabulary (`pathway.status`, `path.composition_observation`), status model, methods
   page and data-api format note updated; the schema test now asserts that no route is ever derived
   or demonstrated through a non-demonstrated pathway (63/63).
3. The pathway (finding 6): `pathway:thermal-expansion-flexoelectric-response`, "Thermal-expansion
   flexoelectric thermopolarization", status observed, K4, `observed_through:
   claim:flexo-produces-charge`, evidence the preprint, no performance datum (the FEM ≈ 0.5 K stays
   model scope in a note).
4. Constituent evidence and conditions (findings 7–9): the preprint added to the four claims it
   physically establishes (not to the surface-charge → electricity step);
   `claim:thermal-expansion-produces-stress` now reads "non-uniform thermal expansion is mechanically
   incompatible across adjacent regions of a solid, or is constrained by an adjoining material or
   structure … the constraining region may be the cooler part of the same continuous specimen";
   `claim:flexo-drives` names spatially non-uniform thermal expansion as a source of the strain
   gradient.
5. Record (findings 10–11, 17): a manual run for the reviewer's web search; Han 2026 as
   insufficient-information (driver and load unverified behind the paywall — owner read filed as
   exception `2026-09-21-physical-transformation-atlas-literature-search-ea1c`), Wei 2024 and Yurkov
   2019 as theory-only; the limitations name the missing alias and the pending rerun; the conclusion
   names the observed pathway; follow-up marked completed. Result stays inconclusive / partial.
6. Terms (findings 13–15): aliases thermoflexoelectric effect / thermo-flexoelectric effect /
   thermoflexoelectricity on the flexoelectric effect (source Wei 2024); flexothermal and
   thermoflexotronic rejected; thermopolarization kept as the broader driver-qualified name.
7. Times corrected: every loop-3 log header (passes 1–23) and the hand-entered `started_at` /
   `completed_at` / `executed_at` values in the reviewed records were anchored on the transcript and
   commit timestamps — the earlier headers had drifted up to seven hours ahead of the clock (pass 23
   was 12:12–12:55 am, not 5:10–8:10 am, and its reply took ~7 min, not ~75).

Not done: the thermoflexoelectric OpenAlex rerun (finding 16; budget exhausted, 10:00 am Sydney
21/09 at the earliest) and Scholar's mandatory forms (captcha). Pass 25 (finding 18): candidate 5,
thermoacoustic → classical acoustoelectric (p-690d387078), plan written, aliases ready.

Result: revision effd637ae126 — 493 claims · 186 sources · 86 pathways (one observed) · 863 routes ·
80 demonstrated · 7 reviewed searches · 10 candidate compositions · 63/63 · axe clean · exports valid
· live (frontier row 8 rendered in headless Edge: "OBSERVED · OUTPUT NOT DELIVERED · search incomplete").
