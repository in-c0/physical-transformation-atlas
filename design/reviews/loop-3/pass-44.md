# Pass 44 — source restoration as typed measurements (21/09/2026 8:26–8:46 pm Sydney, build; message after)

Built on the reviewer's pass-43 order (findings 11–34): the four groups of physical data that the
passes 35–39 sweeps had removed for want of a read primary, restored from primaries read now — each
with its denominator, its operating point and its scope, under the unchanged v0.5.0 format.

## Built

1. Thermoacoustic (Wu 2014; Bi 2017 — both publisher abstracts read in the owner's Chrome; the
   reviewer's "2014" for the 5 kW machine was wrong, it is Applied Energy 185 (2017), online
   December 2015): `pathway:thermoacoustic-generator` carries four data — 19.8 % at 970 W (Wu:
   4.0 MPa, 64 Hz with 4.5 % argon, 650 / 15 °C → T_h 923.15 K, T_c 288.15 K), 1043 W maximum
   power at 17.7 % (a `power` datum), 18.4 % at 3.46 kW (Bi: three stages, 6 MPa helium, 650 /
   25 °C → 923.15 / 298.15 K) and 4.69 kW at 15.6 % (`power`). The maximum-efficiency and
   maximum-power points are never combined; the typed Carnot evaluator decides: 19.8 % ≤ 68.8 %,
   18.4 % ≤ 67.7 %, the route's thermodynamic-bound check PASS (it had read unresolved since pass
   35 for want of a datum). Backhaus, Tward & Petach 2004 stays a full-text item; its abstract has
   no number.
2. Wind (NREL/CP-500-38157, Migliore, Green, Calley & Lonjaret, August 2005 — read in full from
   the Internet Archive's copy, nrel.gov not resolving from this machine): the Storm pre-prototype
   rotor's peak C_p ≈ 0.45, "deduced from field-test data of measured electrical power and
   dynamometer tests of alternator efficiency", with the broad, flat curve near 0.43 over a 4 m/s
   range in its conditions — metric `power-coefficient`, scope field, `datum_kind: derived`, basis
   exactly the Betz constraint's ("rotor power coefficient on the free-stream kinetic power through
   the swept area") so the typed bound evaluates it: 0.45 ≤ 59.3 %, PASS. No conversion-efficiency
   datum exists on the wind pathway; the old 0.52 stays retired.
3. Hydro (DOE/OSTI 10.2172/1346739, Schneider, Schneider, McKinstry & Harwood 2017, award
   DE-EE0005420 — read in full from the Internet Archive's copy, osti.gov timing out): the Monroe
   Hydro SLH100 hydroEngine (linearly moving foils, not a rotor) on the NUID main canal at Madras,
   Oregon — 250 kW nameplate, gross head 4.1–5.1 m, 331 cfs maximum, 267 kW maximum observed:
   "water-to-wire plant efficiency of 60% (73% hydraulic efficiency)". The 60 % is the pathway's
   datum (plant, derived, basis water-to-wire as the report states it — no formula and no grid-side
   boundary given, said so); the 73 % is the turbine stage's datum under the new metric
   `device-stage-efficiency`, so the page's derived best efficiency is 60 %, never 73 %.
4. Betavoltaic (two open primaries read in full): Kim et al., Carbon Energy 8(5) e70149 (2026) —
   the ¹⁴C perovskite cell's 10.79 % ECE with the Supporting Information's Equation 1 as its basis:
   J_sc × V_oc × FF / (E_avg × e × A), A = 4.5 µCi per 1.0 cm², E_avg = 49.4 keV per decay, the
   worked 0.142 nW / 1.316 nW — the denominator is the source's total decay power from its nominal
   activity, no self-absorption correction (the .docx SI was parsed in the page). Zhang et al.,
   Nanomaterials 15(9) 635 (2025) — the 4H-SiC devices under a 15 mCi ⁶³Ni source: the whole-battery
   total efficiency 2.34–2.56 % (Table 4; value_numeric the upper end; η = η_s × η_d on the same
   isotope-source-power denominator, Equation 1) and the semiconductor DEVICE efficiency η_d 7.31 %
   (Table 3) recorded as `device-stage-efficiency` with the basis "output power relative to the beta
   power leaving the source, excluding self-absorption" — it can never satisfy the route's
   conversion-efficiency metric. The page's derived best efficiency is 10.79 %.
5. The metric `device-stage-efficiency` (one stage's efficiency relative to the energy delivered to
   that stage) joins the registry; the loader refuses one whose basis does not name the stage and its
   denominator; the derived "best recorded efficiency" ignores it by construction (it filters on
   conversion-efficiency). The pass-42 audit gate learned that a physical datum recorded later may
   decide a bound that was already typed (the two routes above moved unresolved → pass); a move with
   no datum behind it is still refused.
6. Regressions (finding 34): Wu's 19.8 % and Bi's 18.4 % distinct records with their own sources and
   temperatures; Bi's 4.69 kW never paired with 18.4 % (and 15.6 % is never an efficiency record of
   its own); the Storm 0.45 is `power-coefficient` and the wind pathway has no conversion-efficiency
   datum; Monroe 60 % water-to-wire vs 73 % `device-stage-efficiency`; Zhang 7.31 % cannot satisfy
   the route metric; every betavoltaic conversion-efficiency datum names an isotope-energy
   denominator; the derived best efficiencies are 60 %, 10.79 % and 19.8 %; a stage efficiency
   without its stage and denominator is refused (temp copy); no restored datum recreates a retired
   key. The Betz regression of pass 19 updated (the Storm datum now passes it). 83/83.

Result: revision 7695b278343a — 348 entities · 520 claims · 233 sources · 92 pathways · 2 systems ·
771 routes · 86 demonstrated · 83/83 · axe clean · exports valid against v0.5.0 · three audit gates
consistent · live.

## Reviewed (sent 8:55 pm in the new chat https://chatgpt.com/c/6ab10cd2-b9ec-83ec-9d17-df9b724c1153; ChatGPT High, ~8 min, with web search; PASS — 14 findings)

1. The four restorations accepted (findings 1–5, 9): Wu 2014 and Bi 2017 verified separating
   the maximum-power and maximum-efficiency points; the Carnot factors 68.79 % / 67.70 % confirmed;
   the Storm as a field / derived / power-coefficient datum; Monroe split at the system boundary
   with a conservative basis; Zhang's η_d never a whole-battery efficiency; Kim eligible as the
   whole-device record with the SI's denominator.
2. One correction carried immediately (findings 6–8): a range is never a scalar. `Measurement`
   is a scalar-or-range union — `value_range: [low, high]` mutually exclusive with `value_numeric`;
   Zhang's 2.34–2.56 % has no per-device tuple in Table 4 or §3.4.2, so no scalar; individual
   source rows stay scalars, aggregate ranges stay ranges; the best-efficiency reducer never
   scalarises a range (Kim's 10.79 % is the scalar best; Zhang is separately a reported range); a
   bound passes a range whose upper end is within it, fails one whose lower end exceeds it, and
   leaves a straddling range unresolved; regressions for all four rules and a round-trip export.
3. The order set (findings 10–14): pass 45 = range semantics (landed here) + the stage-versus-route
   measurement audit of the TREC, TPV, PV, rectenna and every other efficiency-bearing pathway —
   read each source's denominator and classify the datum as route conversion-efficiency,
   device-stage-efficiency, another metric, or unresolved; the denominator boundary, never the
   scope label, decides; pass 46 = the PEC architecture bounds (Fountaine 2016's 30.6 % single /
   40.0 % dual as assumption-conditioned limits; Cheng 2018's own GaInP/GaInAs 1.78 / 1.26 eV pair
   with its 22.8 % theoretical limit as the first exact Pathway.bounds entry); pass 47 = the
   generalised stage-omission report as an audit, not a classifier; Planck last, never a
   temperature-free datum.

## Closed (9:05–9:14 pm; findings 6–8 applied, live at r55e058fc2336)

- `Measurement.value_range` (`[low, high]`, tuple) with a refinement refusing a scalar beside it
  and a reversed pair; the bound evaluator carries a range's ends (within → pass, straddling →
  unresolved "straddles the bound", lower end above → fail "at its lower end"); the coverage
  check counts a range as structured and screens both ends against [0, 1]; the route page lists
  "reported range" rows beside the derived best, which ignores them; Zhang's datum is now
  `value_range: [0.0234, 0.0256]` with the basis saying why no scalar exists.
- Regressions: the Zhang range carries no scalar; 2.56 % is never an independently observed datum;
  a range with a scalar and a reversed range are refused by the schema; the export preserves both
  ends; the derived bests are unchanged (19.8 % / 60 % / 10.79 %); the synthetic within /
  straddling / above cases decide as ruled. 84/84, axe clean, exports valid, gates consistent.
- Additive within v0.5.0, documented in the contract's record description and format history.
