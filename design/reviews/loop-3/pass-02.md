# Pass 2 — data audit (19/09/2026 ~12:55 pm Sydney)

Focus sent: audit /api/claims.json, /api/pathways.json, /api/sources.json — ten-plus claims across domains
for status honesty, conditions, energy ledger, source support; three pathway figures. ChatGPT could not
fetch the Worker's JSON from its browsing sandbox and audited the canonical YAML in the public repo
instead (26 claims + 3 figures, ~10 min). Verdict: PIVOT.

## Findings (condensed)

- Six controls fine as `established`: seebeck-drives, piezo-drives, galvanic-drives, pv-drives,
  spin-current-drives-ishe, particles-drive-betavoltaic.
- Delete `claim:fuel-cell-requires-membrane` (only PEMFCs need one; SOFC/AFC/PAFC/MCFC do not).
  DOI 10.1155/2024/7271748.
- `claim:concentration-cell-drives` relation wrongly takes temperature as input with V/K; the driver is the
  activity ratio, T is a parameter in RT/zF.
- `claim:pyro-drives`: pyroelectric current responds to dT/dt, not ∇T; keep the row, make the indexing
  compromise unmissable. DOI 10.1063/1.2062916.
- `replicated` used with one source: capacitive mixing (Brogioli 2009 only) → `demonstrated`.
- Bulk photovoltaic effect under-claimed (`replicated`): decades of literature → `established`, add
  Fridkin 1984 DOI 10.1080/00150198408245047.
- Radiative cooling `replicated` on one lineage: add Zhai 2017 DOI 10.1126/science.aai7899 and Kou 2017
  DOI 10.1021/acsphotonics.6b00991.
- `claim:sse-drives`: the Pt strip is a detection arrangement, not a condition of the effect; add Weiler 2013
  DOI 10.1103/PhysRevLett.111.176601.
- Spin pumping `established` on the 2002 theory paper alone: add Tserkovnyak RMP 2005
  DOI 10.1103/RevModPhys.77.1375 and Mosendz 2010 DOI 10.1103/PhysRevLett.104.046601.
- Fission/fusion conflate the reaction with reactor/plasma conditions and with thermalisation: ledger
  nuclear→kinetic, thermalisation step kinetic→thermal; conditions reworded; add Frisch 1939
  DOI 10.1038/143276a0, Lawson 1957 DOI 10.1088/0370-1301/70/1/303, NIF 2024
  DOI 10.1103/PhysRevLett.132.065102; note "net electrical output from a fusion plant is not demonstrated".
- Pathway figures: rectenna record is 90.6% (single element, 8 W) not 84% (array); passive cooler's
  "~100 W/m² at night" must not be spliced onto Raman's measured 40.1 W/m²; droplet 50.1 W/m² at 332 kΩ.
- Next data pass suggested: apply "replicated = several groups recorded" across all 384 claims.

## Applied

See commit for pass 2 (all fifteen changes, plus a repo-wide sweep of `replicated` claims with one source).
