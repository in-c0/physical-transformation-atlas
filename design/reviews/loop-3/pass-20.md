# Pass 20 — the last two unaudited candidate compositions, as physics (20/09/2026 ~9:58–10:25 pm Sydney)

Focus sent: the resonant flexoelectric harvester (p-eb27612d17) and the vibration-driven
elastocaloric cooler (p-4e0ffe1336), judged as in pass 16 (GENUINE / KNOWN DEVICE / ARTEFACT /
BLOCKED with the concrete data change), plus which candidate to search next. ChatGPT (High,
~10 min). Verdict: PIVOT — 12 findings; both routes ARTEFACTS of a missing direct spelling, each with
a real device or proposal underneath.

Verification before recording: Yang et al. 2025 read in full on the publisher's page (unpolarised
α-PVDF flexoelectric layer on an epoxy cantilever; vibration exciter at 20 Hz and 0.915 g; measured
average output ≈ 0.19 V against 0.167 V predicted; the 3.58 V / 94.93 mW m⁻³ at the 1.2 Hz resonance
are theory and FEA, the shaker could not reach 1.2 Hz; the authors count theirs, with Thai et al.,
among the only pure flexoelectric harvesters tested); Kumar et al. 2019 abstract on Crossref
(FEA proposal, 0.02 K per element, 0.2 K in 50 s for ten elements at 1.5 Hz, ≈ 2 K from 358 K);
Li, Cheng and Sun 2022 abstract on the HKUST repository record (ScienceDirect answered with a
captcha, not completed): 7.20 % surface strain, 5.64 N g⁻¹, 5.5 K, 0.137 W g⁻¹, 11.5 W multi-row.

## Applied

- The structural defect: the atlas had no route from mechanical vibration to a stress state
  except through resonant vibration, so every vibration-driven stress converter was spelled with
  resonance as a mandatory step. One deviation from the reviewer's exact claim: a disequilibrium
  cannot `produce` a disequilibrium (the typed chain), so the direct spelling goes through elastic
  deformation, as the pressure routes already do — `claim:vibration-drives-elastic` (mechanical
  vibration drives elastic deformation; cyclic deformation, resonance amplifies but is not
  required; Erturk & Inman 2011, Yang 2025, Kumar 2019) and `claim:elastic-produces-stress`
  (elastic deformation produces the mechanical-stress state; Nye 1985, Erturk & Inman 2011).
  No new compiler rule was needed: resonant vibration and elastic deformation carry no coupling
  family, so the pass-16 family-core normalisation already makes the resonance spellings
  representation-equivalent to the direct routes, which carry the recorded pathways and are
  therefore the representatives.
- Pathways: `flexoelectric-vibration-harvester` (demonstrated, K5; ≈ 0.19 V average at 20 Hz and
  0.915 g, off resonance; the theory/FEA numbers are named and not recorded),
  `vibration-elastocaloric-cooler` (proposed, K3; the FEA figures recorded with `scope: model`),
  `bending-actuated-elastocaloric-cooler` (demonstrated, K6; starts at the mechanical-stress row
  because the driver is an actuator, with its three measurements). Transducers for each;
  `implemented_by` claims; the elastocaloric effect gains the aliases mechanocaloric effect,
  stress-induced caloric effect and elastocaloric cooling for the next route search.
- No magnitude constraint was added: the reviewer showed the "~500 MPa NiTi threshold" is
  material- and mode-dependent (bending transforms NiTi at 5.64 N g⁻¹), so BLOCKED would have been
  a false prohibition.
- Regression test (finding 11): both resonance spellings are representation-equivalent to their
  direct routes; Yang 2025 demonstrates the direct flexoelectric route only; Kumar 2019 attaches as
  a proposal and demonstrates nothing; the bending cooler is demonstrated on its own. 60/60.

## Result

The default frontier now shows three candidate compositions, all carrying literature proposals
and reviewed partial searches (the two Marangoni streaming generators and TOEC): every candidate
the frontier presented on 20/09 has been audited. The direct vibration → elastocaloric route is
classed *derived* (it contains the whole bending-actuated cooler pathway as its tail and adds a
driver), which is the honest reading: the conversion stage is demonstrated, the driver is the open
question. Next search, as recommended: TOEC (pass 21 or later). Revision r24ead18bdd7c · 479 claims
· 167 sources · 79 pathways · 791 routes · 75 demonstrated · axe clean · exports valid · live.
