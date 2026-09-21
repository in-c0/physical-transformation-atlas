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

## Reviewed (sent 3:40 pm; ChatGPT High, ~8 min, with web search; PIVOT — 34 findings) and applied (3:48–3:55 pm)

1. The closure accepted (finding 1).
2. The registry's definitions rewritten in the reviewer's words (findings 2–16): twelve of sixteen
   changed — no "maintained" on the spatial gradient (a transient gradient qualifies), no "at a
   stated cycle frequency" on any cycling token (cycling is the existence of cycling, never the
   availability of a measured frequency; `cycle_frequency_Hz` may derive one, its absence never
   negates demonstrated cycling — finding 17), "experienced by the active material" instead of
   "applied" on the field tokens, the thermoacoustic threshold defined as a physical state rather
   than bound to Swift's formulation, the transition token without the interchangeable examples,
   stress-change covering strain-controlled loading, and the above-bandgap token as "an incident
   photon flux containing absorbable photons with hν > E_g" so a broadband spectrum qualifies. The
   expansion pressure drop stays exactly as frozen. No `*-frequency-recorded` tokens.
3. The Rankine plant's feedwater pump (findings 18–24): a recirculating-work auxiliary on
   `pathway:rankine-steam-plant` with `establishes: []` — `claim:expansion-drives` keeps its
   cycle-level temperature-gradient abstraction and never requires the pressure drop (finding 21) —
   on the Al-Mosyab source read in full (three main boiler feedwater pumps, three condensate pumps,
   a deaerator, the feed pump in the unit's exergy ledger). Not on the steam engine (a generic
   spelling demonstrated by the Rankine transducer — a pathway-specificity item for a later
   architecture audit, finding 25) and not on the nuclear plant, which owes the pressure-drop
   provider and stays unresolved until its named architecture is source-reviewed.
4. Pass 37 set (findings 26–34): the 25 `power_density` fields with the pass-35 machinery — every
   mixed "measured; projected" string split; a physical value with a defined denominator and basis
   → a physical measurement, a source-defined projection with an explicit denominator → a model
   measurement, a projection without a reproducible basis → removed and kept in the audit note; a
   power in W with no normalisation is `wrong-quantity`, migrated to its actual quantity (a power
   metric added if needed), never called W/m²; dispositions measured-and-projected-mixed ·
   wrong-quantity · unsupported-generic · ambiguous-normalisation · migrate-to-measurement ·
   verified-same-architecture; then `power_density` leaves the writable schema like
   `efficiency_typical`, with any "best recorded power density" derived from structured physical
   measurements of matching units and bases; seven regression controls.

Result: revision c7ed65f08cbd — 340 entities · 507 claims · 218 sources · 89 pathways · 1 system ·
751 routes · 75/75 · axe clean · exports valid · live.
