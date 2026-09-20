# Pass 3 — ontology gaps (19/09/2026 ~11:20 pm Sydney)

Focus sent: name the fifteen most important missing well-established phenomena, with driver, carrier,
family, status and a DOI each; missing rows/columns. ChatGPT browsed the repo YAML (7m 49s). Verdict: PIVOT.

## Findings (condensed)

Fifteen phenomena: radiation pressure, Dufour effect, Marangoni effect, acoustoelectric effect, photon drag,
spin Nernst effect, photo-Dember effect, thermo-osmosis, electrohydrodynamic generation, ionic thermoelectric
effect, thermomagnetic (ferrofluid) convection, thermal shape-memory effect, thermochemical redox cycle,
alphavoltaic effect, radioluminescence — each with a DOI (all verified against Crossref on ingest).

Structural: one missing row (acoustic field); eight new columns (photon-momentum, thermodiffusive,
marangoni, acoustoelectric, photodiffusive, thermo-osmotic, electrohydrodynamic, radioluminescent); broaden
thermomagnetic, caloric and thermochemical definitions; split alphavoltaic from betavoltaic and give the
carriers honest names; radioactive decay should not be `member_of` radiovoltaic; encode radioluminescence
compositionally; add carrier:chemical-fuel; keep thermophotonics out (theory only).

Rejected candidates with reasons: thermoacoustic refrigeration (work-input direction), electrowetting
(consumes work; reverse electrowetting present), electret generators (electrostatic implementation),
mixing-entropy batteries (compositions of present mechanisms), thermally regenerative ammonia battery
(chemistry-specific TREC), microbial fuel cells (should be microbial electrogenesis later), magnetic shape
memory (material-specific realisation).

## Applied

Everything above, as `data/canonical/entities/phenomena-pass3.yaml`, `claims/pass3-gaps.yaml`, and edits
to disequilibria/couplings/carriers/pathways. Sources generated from Crossref by the new
`pipelines/src/source-from-doi.ts` (one DOI, 10.11395/jjsem.25.178, is not in Crossref and was replaced
by Otsuka & Wayman 1998 as the shape-memory reference). Result: 97 phenomena · 23 drivers · 39 families ·
441 claims · 586 routes · 897 cells; evidence-rule test green. Commits eb7319f + two follow-ups.
