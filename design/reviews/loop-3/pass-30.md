# Pass 30 — the eighth check: driver / regime sufficiency, and the temporal temperature change the pyroelectric row needed (21/09/2026 11:45 am – 12:15 pm Sydney)

Focus sent: the eighth physics check built from the reviewer's pass-29 findings 18–21 — `regime_requires`
/ `regime_provides` / `regime_external` on claims, `regime_provides` / `regime_excludes` on
disequilibria, PASS / FAIL / UNRESOLVED / UNKNOWN as specified, first tokens on the pyroelectric,
Seebeck and thermoacoustic steps — with three implementation choices to confirm (a step's own stated
condition as a provider; a produced disequilibrium's providers; no exclusions yet), a request for the
next token inventory, and the question whether the pyroelectric harvester should stay unresolved
forever. ChatGPT (High, ~5 min, with web search). Verdict: PIVOT — 29 findings.

Verification before recording: the reviewer's physics claims for the inventory were checked against
what the atlas already holds (Pecharsky & Gschneidner for the field change, Mischenko 2006 for the
electrocaloric field step, Tušek 2016 for elastocaloric loading, Waske's thermomagnetic plates,
Quickenden & Vernon's thermogalvanic ΔT, the Shockley–Queisser band-gap separation) — all already
recorded sources on the claims concerned; no new source was needed.

## Applied

1. The check (pass-29 findings 18–21, pass-30 findings 1–7): `checkDriverRegimeSufficiency`, core,
   reads every step with a machine-readable requirement (a cooling conversion may require a cycle);
   providers are the route source's `regime_provides`, every preceding step's `regime_provides` (and
   that of any disequilibrium a preceding step produces), the exact reviewed pathway's
   `regime_provides` (new on `Pathway`), and the step's `regime_external` — which the loader now
   rejects when the token is of the step's own subject's kind (a thermal token on a thermally driven
   step cannot self-certify) or absent from its requirements. FAIL only when the source's
   `regime_excludes` names an unsupplied requirement; UNRESOLVED when nothing recorded supplies one;
   UNKNOWN when no step requires anything. Registry, labels, /methods ("eight checks", five core),
   data-api (with the token list), README.
2. The temporal temperature change (findings 8–12): `quantity:temperature-rate` and the 24th
   disequilibrium `disequilibrium:temperature-change` (provides
   `thermal:temporal-temperature-change`); `claim:pyro-drives` re-spelled onto it — the pyroelectric
   harvester now passes from its physical driver and the old static-gradient spelling is gone rather
   than unresolved forever; the three caloric single events (magneto-, electro-, elastocaloric
   `produces`) now produce a temperature change, not a gradient, and provide the token — the direct
   caloric → gradient → Seebeck / thermoacoustic routes that existed only through that mislabel are
   eliminated (945 → 724 routes), while a caloric event can feed pyroelectricity at the regime level.
3. The inventory (findings 13–23): field tokens (`disequilibrium:magnetic-field-change` provides the
   field change; magnetocaloric-drives requires it and passes; electrocaloric-drives requires an
   electric-field change the static potential difference does not guarantee — unresolved; the
   refrigeration conversions require cycling), mechanical tokens (elastocaloric-drives requires a
   stress change and the transformation threshold; `elastic-produces-stress` provides the change from
   vibration, never the threshold — the vibration cooler candidate is unresolved on exactly that;
   the cooling conversion requires cycling), thermomagnetic tokens (the generator's claim requires the
   gradient, the transition straddled and cyclic exposure; the pathway provides the last two),
   thermogalvanic (the gradient, pass), the ferrofluid convection claim (the gradient plus a
   non-uniform magnetic field as a legitimate external condition — pass), the thermoacoustic threshold
   (no self-certification; the three operating engine pathways provide it, the acoustoelectric candidate
   stays unresolved), light tokens (`radiation-flux` provides incident flux; both photovoltaic steps
   require above-band-gap flux, which the module, the thermophotovoltaic, the μTPV and the
   radioluminescent battery provide from their own evidence); no thermionic or flow tokens; the uniform
   thermal bath excludes a spatial gradient.
4. Results over 724 routes: 62 pass, 99 unresolved, 563 unknown, none fail; every demonstrated
   pathway passes or is unknown; the candidates p-231472e45e and p-4d6800fa81 read unresolved for
   the reasons the reviewer named, p-1043a15e01 passes through its external field.
5. Tests (finding 24): the synthetic check test, and the reviewer's ten regressions on real routes;
   68/68.

Result: revision d9cf918a7ad0 — 337 entities (24 disequilibria) · 503 claims · 208 sources · 88
pathways · 724 routes · 82 demonstrated · 12 reviewed searches · 10 candidate compositions · 68/68 ·
axe clean · exports valid · live. Pass 31 (findings 25–29): structured temperatures — freeze the
`Measurement.parameters` names (T_h_K, T_c_K, T_initial_K, T_final_K, dT_dt_K_s, T_transition_K,
temperature_gradient_K_m, gradient_length_m, cycle_frequency_Hz) with a validator, keep the three TEG /
RTG fixtures, source-read the Rankine, gas-turbine, OTEC, thermoacoustic and thermomagnetic
measurements one pathway at a time, and let the regime check consume a pathway's own parameters.
