# Pass 37 — the power_density sweep (21/09/2026 3:58–4:24 pm Sydney, build; message after)

Built on the reviewer's pass-36 order (findings 26–34): the 25 legacy `power_density` fields disposed
with the pass-35 machinery (`pass-37-dispositions.yaml` → `tools/audit-performance.mjs --pass 37` →
[`pass-37-audit.md`](pass-37-audit.md), gated in the tests), every mixed string split, every bare
power called by its name, the key retired from the writable schema.

## Built

1. Migrated from sources read this pass (six): the passive radiative cooler's 40.1 W/m² cooling
   power at ambient air temperature under > 850 W/m² sunlight (Raman 2014, abstract on the Nature
   page); the reverse-electrowetting harvester's ≈ 10² W/m² measured level normalised to the
   liquid–substrate overlap area (Krupenkin & Taylor 2011, open page) — the "≈ 1 mW per
   droplet-electrode" the atlas carried appears nowhere in the paper and the abstract's "up to
   10³ W/m²" is a stated potential with no basis in the text read, kept only in the audit; the
   evaporation-driven engine's 60 mW peak bursts and 1.8 mW average into 100 kΩ at 30 °C water
   (Chen 2015, open PDF) — the legacy field had called a power a power-per-kilogram
   (`wrong-quantity`); the thermophotovoltaic cell's 2.39 W/cm² at 41.1 % and a 2400 °C emitter
   (LaPotin 2022); Beeby 2007's electromagnetic generator, 46 µW into 4 kΩ at 0.59 m/s² and 52 Hz
   from 0.15 cm³ (a power datum; the derived 307 µW/cm³ in the note) replacing a generic range; the
   droplet generator's 50.1 W/m² instantaneous peak at 332.0 kΩ (Xu 2020, Extended Data Fig. 2c).
2. Removed (nineteen): generic ranges with no device or page (flow-induced vibration, TEG 1 W/cm²,
   pyroelectric, piezoelectric, electrostatic, magnetoelectric, betavoltaic, spin-Seebeck); a
   duplicate of a structured datum (pneumatic 1.43 mW/cm³ — the datum itself now carries metric,
   unit and basis, as does its 140 µW peak as a power); unread-page normalisations
   (`ambiguous-normalisation`: capacitive mixing, thermogalvanic, reverse electrodialysis,
   pressure-retarded osmosis with its economic-threshold sentence, RTG specific power,
   hydrovoltaic); a Galfenol figure attributed to Wang & Yuan 2008, whose abstract describes a
   Metglas 2605SC harvester; the triboelectric "up to ≈ 500 W/m²" that the cited 2012 paper does
   not contain; the PV "≈ 200 W/m²" that is arithmetic on a typical; and the night-time
   radiative-cooling TEG's "25 mW/m² measured; ≈ 0.5 W/m² projected" — split as ruled, but Raman,
   Li & Fan 2019 has no abstract on Crossref or OpenAlex and Cell Press refuses the fetch, so
   neither number could be verified and both wait in the audit for a read.
3. The schema and loader: `Pathway.performance.power_density` no longer writable; metric `power`
   added for absolute outputs; a density metric (power-density, mechanical-power-density,
   current-density, work-per-volume) must state its normalisation in the unit and carry a basis
   (loader-refused otherwise), so a bare power can never satisfy a power-density metric; the
   coverage summary and the route page no longer read the legacy field; the route page derives the
   best recorded power density per unit from physical measurements only.
4. Tally: measured-and-projected-mixed 2 · wrong-quantity 2 · unsupported-generic 11 ·
   ambiguous-normalisation 6 · migrate-to-measurement 3 · verified-same-architecture 1 → migrated
   4 · split 2 · removed 19. Regressions (finding 34), all in the suite: no `power_density` on any
   pathway; every power-density datum has a per-unit and a basis; every power datum has none; no
   model-scope power density exists to become "best recorded"; the evaporation engine's 60 mW is a
   power; the pass-37 gate passes; systems stay measurements-only; 751 routes. 76/76.

Result: revision b6d5f114a056 — 340 entities · 507 claims · 218 sources · 89 pathways · 1 system ·
751 routes · 76/76 · axe clean · exports valid · live.

## Reviewed (sent 4:26 pm; ChatGPT High, ~8 min, with web search; PIVOT — 35 findings) and applied (4:34–4:45 pm)

1. The sweep accepted (finding 1); the reverse-electrowetting datum kept (findings 2–3, 8–9):
   per liquid–substrate overlap area is a legitimate active-interface basis — recorded as such,
   never relabelled as device footprint; the 10³ W/m² stays out.
2. The schema correction (findings 4–7): same units never imply comparable densities.
   `Measurement.normalization: { kind: area | volume | mass | length | count, basis }` with the basis
   drawn from a frozen registry (liquid-substrate-overlap-area, radiative-cooler-area,
   active-device-area, device-footprint-area, module-area, electrode-area, membrane-area,
   active-material-volume, device-volume, active-material-mass, device-mass, and `unstated` for a
   source that gives the dimension but not the referent), served as vocabulary
   `measurement.normalization.kind` / `.basis`; the loader requires it on every density metric and
   forbids it on an absolute `power`; all ten density data carry one; the route page's derived
   "best recorded power density" groups by metric + unit + kind + basis and names the basis.
3. Raman, Li & Fan 2019 (findings 10–15): not filed to the owner — the primary was read in full on
   the Cell Press page in her Chrome (the article's PII is S2542-4351(19)30412-X; the DOI page
   renders an empty shell): J_sc 44 mA, V_oc 79 mV, nearly 0.8 mW at the maximum power point from a
   Marlow TG12-4 module, normalised to the 200 mm radiative-cooler area → 25 mW/m², clear-night
   rooftop at Stanford in late December 2017; recorded as a device datum per radiative-cooler area;
   the 0.5 W/m² stays out as the authors' pathway to improvement. Ruling recorded: a secondary source
   corroborates, never promotes a device datum while the primary is unread.
4. Pass 38 set (findings 16–34): the steam / nuclear heat-engine architecture audit —
   `claim:fission-produces-hot-gas` narrowed to directly heated / same-circuit configurations (PWR
   removed from it); `pathway:nuclear-steam-plant` re-spelled binding-drives-fission →
   fission-produces-gradient → expansion-drives → … so it passes the regime check through the
   spatial gradient and stops being the pressure-drop exception; PWR / BWR loops later via the
   system layer; no nuclear feed-pump auxiliary; `pathway:steam-engine` renamed "Steam Rankine
   cycle (shaft work)" to match its Rankine transducer; seven regressions, the route count explained
   if it moves. Pass 39: the owner-free ambiguous-source sweep, retained assertions first.

Result: revision d9394a49eb6e — 340 entities · 507 claims · 218 sources · 89 pathways · 1 system ·
751 routes · 76/76 · axe clean · exports valid · live.
