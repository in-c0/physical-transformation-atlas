# Pass 39 — the retained-assertion sweep to zero stored records (21/09/2026 5:17–5:27 pm Sydney, build; message after)

Built on the reviewer's pass-38 order (findings 19–30): the six surviving `efficiency_record`
fields and the four limit rows resolved against open primaries in closure order, then the key
retired from the writable schema like `efficiency_typical` and `power_density` before it.

## Built

1. Photosynthesis first (findings 20–21): Blankenship et al. 2011 read in full on its open
   eScholarship copy — "a theoretical limit of ~12 % for the efficiency of photosynthetic glucose
   production from water (based on free energy) can be calculated by considering the chlorophyll
   band-edge absorption and the two-photosystem structure"; known losses reduce the maximum to 4.6 %
   (C3) and 6.0 % (C4); short-term growing-season efficiencies reach 3.5 % (C3) and 4.3 % (C4),
   perhaps 5–7 % for microalgae in bubbled bioreactors. The 0.045 record removed (none of the
   paper's figures is 4.5 %; a measured record returns from Zhu, Long & Ort once read); the limit
   rewritten with its basis and the physiology-limited maxima named as such.
2. Rectenna second (findings 22–23): Brown's 1977 NASA contractor report CR-135194 read in full on
   NTRS — the improved element reached "an efficiency of 90.5 ± 0.5 % at the 8 watt input level and
   79.5 ± 0.5 % at the 50 milliwatt level", 45 % at 1 mW, at 2450 MHz; the certified DC-to-DC system
   efficiency of March 1975 was 54 %; Goldstone converted over 82 % of the impinging microwave power
   into over 30 kW. The 90.6 % the later reviews quote is not in the report: migrated to a device
   datum at 90.5 ± 0.5 % with its basis, the 0.906 deleted, the summary and notes corrected.
3. Fuel cell, wind, hydro, betavoltaic (findings 24–27): removed — 0.65 has no named hydrogen
   device with an LHV / HHV and gross / net basis (PEM systems sit near 60 %; 65 % is a target or a
   molten-carbonate-plus-turbine hybrid); 0.52 is a rotor power coefficient, the wrong quantity for
   a pathway ending in electrical work; 0.95 is a hydraulic turbine efficiency, not water-to-wire;
   0.06 rests on no isotope-powered device (the open ~6 % diamond Schottky result is an
   electron-beam proxy).
4. The four limit rows (finding 28): the solar water heater's "~0.9" clause removed (a
   selective-surface absorptance); the PEC "≈ 30 %" replaced by the statement that a
   detailed-balance limit exists per tandem gap pair (Cheng 2018 at 0.85 of its own) and no
   universal figure is recorded until the bound's model is curated; photosynthesis kept with the
   corrected basis; the TPV "> 50 % projected" moved to `notes` as a projection, the field keeping
   Carnot between emitter and cell.
5. The key retired (finding 29): `Pathway.performance.efficiency_record` no longer writable; the
   bound check, the coverage summary, the route page and the contract stop reading it; the route
   page derives the best recorded efficiency from structured physical measurements as before. The
   pass-35 dispositions updated for the ten rows (the audit gate consistent). Regressions: no
   stored record anywhere; the rectenna datum carries 2450 MHz and its basis; no limit row says
   "projected" or "~0.9"; the photosynthesis limit names the two-photosystem basis. 77/77.

Result: revision 16c27619e704 — 341 entities · 508 claims · 221 sources · 90 pathways · 1 system ·
751 routes · 84 demonstrated · 0 stored efficiency_typical / efficiency_record / power_density ·
77/77 · axe clean · exports valid · live.
