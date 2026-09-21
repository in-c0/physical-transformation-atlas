# Pass 31 — structured temperatures: the parameter registry, regimes from a pathway's own numbers, and the sources that hold them (21/09/2026 12:15–12:55 pm Sydney)

Focus sent: the registry built from the reviewer's pass-30 findings 25–29 (`Measurement.parameters`
keys drawn from a registry served as vocabulary `measurement.parameter`; a stray key fails
validation; a reviewed pathway's own parameters supply regime tokens to its exact route), the
admission that no new temperature was recorded because the five named sources are paywalled or
summary-only, a request for one open primary per pathway, two consequences of pass 30 (an
electric-field-change disequilibrium; the elastocaloric providers), and pass 32. ChatGPT (High, ~5
min, with web search). Verdict: PIVOT — 25 findings.

Verification before recording: Lu et al. 2024 (J. Mar. Sci. Eng. 12:463), Shaheed, Mohammed & Radhi
2023 (Int. J. Heat Technol. 41:253–258), Al Mhanna, Al Hadidi & Al Maskari 2024 (Energies 17:3986)
and Backhaus & Swift 2000 (JASA 107:3148–3166) resolved on Crossref; Waske et al. 2019's
publisher-hosted supplementary PDF downloaded and read — La-Fe-Co-Si (CALORIVAC C) plates with
Tt = 300 K, the fluid circuits switched by ΔT = 30 K, the experimentally optimal cycle frequency
0.8 Hz (1.25 s), fluid flux 0.4 l/min, four Pt1000 sensors at the plate-stack inlet, 0.8 mW output
from the genus-3 circuit falling to 0.01 mW at genus 1, the 285 K / 315 K endpoints only as the
simulation's B–H curves; Tušek et al. 2016's abstract read on the Nature Energy page (15.3 K water-side
span, up to 800 W kg⁻¹, COP up to 7); Lu 2024's abstract read on MDPI (47.5 kW grid-connected,
2.46 % thermal efficiency) — its 28 °C / 4 °C run conditions sit in the full text, which the MDPI
page did not render this sitting.

## Applied

1. The registry (findings 1–2, 10–13): the operating-state names `T_turbine_inlet_K`,
   `T_turbine_exhaust_K`, `T_cooling_water_inlet_K` and `T_condenser_K` added — they describe a
   plant's state and never feed the Carnot bound, which reads only `T_h_K` / `T_c_K` as the
   reservoirs a source defines the efficiency between; `Pathway.regime_model_provides` for regimes a
   model asserts (recorded, never a provider). The derivation now ignores `scope: model` measurements
   entirely and takes only a transition from a `material` one.
2. Thermomagnetic (findings 5–6): the generator's first structured datum — 0.8 mW from the
   pretzel circuit at ΔT = 30 K and 0.8 Hz, `T_transition_K: 300`, `cycle_frequency_Hz: 0.8` —
   from the open supplementary information, with the note that the main text's peak figures and the
   exact temperature pair stay behind the paywall, so no T_h / T_c.
3. Thermoacoustic (findings 3–4): no datum — the 0.30 efficiency belongs to the 2000 JASA study,
   whose 725 °C hot-gas temperature the reviewer ties to the 890 W / 0.22 point, not to 710 W / 0.30;
   an owner library read, not the Los Alamos space-applications report.
4. The changing electric field (findings 14–16): `disequilibrium:electric-field-change`, the 25th,
   providing `field:electric-field-change`; `claim:electrocaloric-drives` re-spelled onto it and the
   static-bias spelling gone — the single electrocaloric effect now passes from its source.
5. The elastocaloric providers (findings 17–21): nothing on `disequilibrium:mechanical-stress`; the
   reviewer's "Tušek 2016 pathway" did not exist, so it now does — `pathway:regenerative-
   elastocaloric-heat-pump` (K7) on a new heating conversion `claim:elastocaloric-converts-heating`,
   with the three mechanical regimes as its providers and its three measurements (15.3 K span,
   800 W kg⁻¹, COP 7); the bending cooler keeps its own; the vibration cooler stays unresolved on
   the transformation threshold, a model never being a provider.
6. Not recorded, with the open primaries named for pass 33 (findings 7–13): OTEC — Lu 2024
   (28 °C / 4 °C, 47.5 kW, 2.46 %); Rankine — Al-Mosyab Unit 3 (539 °C / 152 bar, 24 °C cooling water,
   0.1 bar, 39.3 %); gas turbine — the ISCCS plant data (1050 °C inlet, 540.7 °C exhaust, ≈ 127 MW,
   46.93 %); each to be read in its full text and stored under the operating-state names.

Result: revision 963f3d136870 — 339 entities (25 disequilibria) · 505 claims · 208 sources · 89
pathways · 741 routes · 83 demonstrated · 12 reviewed searches · 64 regime pass · 114 unresolved ·
70/70 · axe clean · exports valid · live. Pass 32 (findings 22–24): the thermopolarization effect's
own route search — a plan for temperature gradient → thermopolarization → surface charge →
electrical work with `thermopolarization` frozen as its composition term and the output vocabulary
extended to power, load and harvesting, its own reviewed record, the reviewer's first query; pass
33 the open-primary measurement sweep.
