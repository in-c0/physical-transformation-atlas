# Pass 7 — data audit of the pass-3 material (20/09/2026 ~12:35 pm Sydney)

Focus sent: audit everything added since the pass-2 audit — `claims/pass3-gaps.yaml` (60 claims),
`entities/phenomena-pass3.yaml` (15 phenomena), `pathways/pathways-everyday.yaml` (25 pathways) and the
sources they cite; physics of subject→predicate→object, energy ledgers, conditions, status versus
evidence, DOI metadata; max 25 defects with exact YAML edits, then up to 5 status changes.
ChatGPT (High, 12 min, 11 sites). Verdict: PIVOT — 17 defects, 3 status changes.

New chat this pass (rotation after six passes); the chatgpt.com renderer hung on three fresh tabs before
a fourth loaded — recorded in design/LOG.md.

## Findings (condensed) and what was done

All twelve DOIs the reviewer cited were re-verified against Crossref before any edit; the Kumar 2019
efficiency figures (1.5 %, 10.5 % of Carnot, maximum near 70 °C) were confirmed from the paper's text
via search because the publisher page is bot-gated.

1. `pathway:waterwheel` ran falling water through the turbine-lift claim. Now gravity → descent →
   `claim:descent-produces-waterwheel-motion` (new, Dixon & Hall) → mechanical work.
2. `pathway:shape-memory-heat-engine` performance said "≈ 1–2 % (about 30 % of Carnot)"; Kumar et al.
   report 1.5 %, 10.5 % of Carnot, at a ~70 °C bath. Value, conditions and theoretical limit rewritten.
3. `claim:dufour-onsager` asserted numerical equality of Soret and Dufour coefficients. Reciprocity is
   between the properly defined cross-coefficients; Würger 2014 (EPJ E 37, 96) added as evidence.
4. `claim:thermochemical-cycle-bounded-carnot` named the re-oxidation temperature as T_L; it is the
   heat-rejection reservoir (Steinfeld 2005).
5. `claim:ehd-produces` produced `carrier:charge-carriers` (electrons in a solid); the 1977 generator
   transports monopolar charge in n-hexane. New `carrier:fluid-space-charge` plus a `converts_into`
   claim to electricity so EHD routes still reach an output.
6. Photon drag: polarity is not universally along the propagation direction (Strait 2019) — summary and
   condition rewritten.
7. Radiation pressure: dissipation no longer booked as intrinsic (perfect reflection dissipates nothing);
   work requires displacement; motion claim now conditional on a free or compliant body.
8. Photo-Dember: `transient-only` removed from the phenomenon and the driving claim; steady-state Dember
   photovoltage (Schetzina 1975, PRB 11, 4994) added as evidence.
9. Shape-memory effect: `temp-gradient-required` moved off the phenomenon (a single recovery event
   needs a temperature crossing, not a gradient); stays on the heat-engine pathway.
10. `claim:shape-memory-bounded-carnot` scoped to cyclic heat-engine operation.
11. Dufour effect: `state-liquid` tag removed (liquid or gas).
12. Acoustoelectric effect: `medium-semiconductor` tag removed from phenomenon and both driving claims
   (Parmenter treats sodium metal as well as germanium).
13. `pathway:steam-engine` listed a Stirling engine as a demonstrating transducer; removed with its
   source.
14. `source:suslov-2022-ferrofluid`: archival issue is 2023, 145(3); year and venue corrected.
15. Radiophotoluminescence removed from the radioluminescence aliases (a storage/readout phenomenon;
   Yanagida 2022).
16. `claim:acoustic-field-drives-piezo`: "every microphone" → piezoelectric microphones and receivers.
17. `pathway:chemiosmotic-atp-synthesis`: "the working transducer of every cell" dropped.

Status changes applied: the three acoustoelectric claims (`acoustic-drives-acoustoelectric`,
`acoustic-wave-drives-acoustoelectric`, `acoustoelectric-produces`) established → demonstrated, with a
note: Parmenter 1953 is the prediction and Weinreich & White 1957 the single recorded observation, so
the atlas threshold for established is not yet met. A second experimental group or a review would
restore it.

Not applied: the reviewer's suggested new source for the shape-memory tag edit (a 2026 modelling paper)
— a tag change needs no new citation.

Result: 308 entities · 444 claims · 152 sources (133/133 DOIs verified) · 64 pathways · 589 routes ·
18/18 tests · axe clean on 12 pages, live.
