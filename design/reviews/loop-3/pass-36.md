# Pass 36 — the gas-turbine / expansion-carrier closure (21/09/2026 3:25–3:38 pm Sydney, build; message after)

Built on the reviewer's pass-35 order (findings 15–31): the causal-model defect pass 35 exposed —
a carrier named "Hot pressurised gas" whose producing step establishes heat, not pressure, and a
turbine step whose pressure ratio comes from a compressor its own shaft drives — closed without
inventing a serial step.

## Built

1. The carrier (findings 16–18): `carrier:hot-gas` is now "Hot gas" (aliases keep "hot pressurised
   gas" so the old name still resolves) with the reviewer's summary: pressure or an available
   expansion ratio is not implied and must be established separately when a downstream conversion
   requires it — thermal emission and the MHD channel consume hot gas without one.
2. The token (findings 19–20): `thermodynamic:expansion-pressure-drop` — "an upstream pressure state
   and downstream lower-pressure state sufficient for the working fluid to perform expansion work" —
   frozen in a new regime-token registry (`REGIME_TOKENS`, every pass-30 token with its definition;
   served as vocabulary `regime.token`; an unregistered token fails validation, tested) and required
   by `claim:hot-gas-drives-expansion` only; not on the carrier, not on
   `claim:combustion-produces-hot-gas`.
3. The provider (findings 21–27): `pathway:combustion-gas-turbine.regime_provides` supplies the token
   and explains it through the new `auxiliary_requirements[]` annotation — `{ kind:
   recirculating-work, energy_form: mechanical, purpose: compressor, establishes:
   [thermodynamic:expansion-pressure-drop], conditions (turbine shaft work drives the compressor;
   Al Mhanna 2024's 505.36 kg/s of air compressed from 0.9981 to 9.4 bar, turbine discharge 1 bar),
   evidence Dixon & Hall 2014 + Al Mhanna 2024 }` with the note that it is a feedback branch, never a
   route claim, and that net efficiencies include this back-work while the enumerated route is the
   useful-output spine. No compressor claim, no combustion → pressure claim; the pathway keeps its
   name. Kinds: recirculating-work · parasitic-load · external-input (vocabulary
   `pathway.auxiliary_requirement.kind`).
4. The loader rule (finding 28): a pathway supplying a token whose registry entry says
   `provider_needs_explanation` (this one) on a route where a step requires it must have a preceding
   step that provides it or an auxiliary that `establishes` it — otherwise validation fails
   (tested on a temp copy with the auxiliary block cut out).
5. The nuclear plant (finding 29) is left unresolved on purpose — its steam-generation / pressure
   architecture awaits a source review — and the pass-30 invariant "no demonstrated route unresolved"
   now carries that one documented exception. The five generic combustion → hot gas → expansion
   routes read unresolved on the token; hot gas → thermal emission acquires nothing; the gas turbine
   passes (regime: 111 pass · 119 unresolved · 521 unknown; 751 routes, the gas-turbine route still
   its seven steps; no route names a compressor).
6. The limit field (finding 31): the ideal-Brayton expression moved from `theoretical_limit` to
   `performance.notes` as a model relation of the air-standard cycle, with the note that real net
   work depends on turbine and compressor work both.
7. The surface: the route page lists "auxiliaries off the route"; the route exports carry
   `auxiliary_requirements`; /methods and docs/data-api.md describe the registry and the annotation.
   75/75; axe clean; exports valid; the audit gate still consistent.

Result: revision 34c911ddd873 — 340 entities · 507 claims · 218 sources · 89 pathways · 1 system ·
751 routes · 16 registered regime tokens · 75/75 · live.
