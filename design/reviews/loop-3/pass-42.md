# Pass 42 — theoretical_limit retired into the typed constraint graph (21/09/2026 7:00–7:28 pm Sydney, build; message after)

Built on the reviewer's pass-41 order (findings 25–40): the last legacy performance summary surface
is gone, and every limit the atlas holds is a constraint record reached through the graph.

## Built

1. The map first (finding 39): `design/reviews/loop-3/pass-42-dispositions.yaml` — 41 prose rows,
   each with the old text (`was`), the constraints already reachable on the route, the proposed
   constraint, the migration class, the evidence and the route's thermodynamic-bound result before
   the sweep (`bound_before`, from rca0172056e74). `tools/audit-limits.mjs` joins it to the compiled
   graph and writes `pass-42-audit.md`; with `--check` it gates (in the suite): no `theoretical_limit`
   key survives in any canonical pathway file, a typed row's constraint is reachable on its route
   and was not reachable before, a noted row has its note, and — the reviewer's finding 37 — the
   bound result of every row where nothing was typed is unchanged. Classes: **already-typed 30**
   (deleted; every Carnot / Betz / ZT / k² / Landsberg / Shockley–Queisser / mixing / Nernst /
   radiative-cooling sentence already reached its constraint through a `bounded_by` claim on a route
   entity), **generic-bound-missing 6**, **pathway-specific-bound 0**, **not-a-bound 5** (two
   removed, three moved to `performance.notes` with their attribution: hydro and the rectenna keep
   "no thermodynamic ceiling below unity" as a note, the two Marangoni proposals keep Pini, Baier and
   Dietzel's findings as source commentary).
2. The six bounds that lived only in prose, typed (finding 28): `constraint:planck-visible-band-fraction`
   (formula-bound on phenomenon:thermal-emission for light output — the Planck band integral as its
   bound, no closed formula, so the check records it as not evaluable until a band-fraction table is
   curated; Bejan 2016); `constraint:gibbs-enthalpy-ratio-bound` (η ≤ ΔG/ΔH, formula from a datum's
   own ΔG and ΔH in kJ/mol — two new registry parameters — reference 237.1/285.8 = 0.83 for H₂ + ½O₂
   → H₂O(l) at 25 °C; the DOE Fuel Cell Handbook, 7th ed., read on the NETL PDF, equations 2-14 to
   2-17, with its note that carbon's ratio passes 100 %; attached to phenomenon:fuel-cell-reaction);
   `constraint:photosynthesis-glucose-free-energy-limit` (upper bound 0.12 with its basis, from
   Blankenship et al. 2011 read in full) plus `constraint:photosynthesis-physiological-maximum` (a
   benchmark — 4.6 % C3 / 6.0 % C4 after known losses, attributed by Blankenship to Zhu, Long & Ort
   2010, verified on Crossref — attached with `governed_by` like Curzon–Ahlborn, listed and never
   decisive); the Nernst bound reused on phenomenon:concentration-cell-effect (the prose was the
   Nernst relation); the mixing free-energy bound reused on phenomenon:capacitive-mixing (the route
   reached no constraint at all); the Landsberg limit reused on phenomenon:photoelectrochemical-effect
   (the universal ceiling; the gap-pair detailed-balance solar-to-hydrogen limit the prose described
   is the first genuine candidate for a pathway-specific bound once an open treatment is read).
3. `Pathway.bounds[]` (findings 29–33): `{ constraint, evidence[] ≥ 1, conditions[], note }`; the
   loader refuses a constraint that is not upper-bound | formula-bound, one the route already
   reaches through a `bounded_by` claim on one of its nodes, and unknown evidence; the
   thermodynamic-bound check merges the exact pathway's bounds into the same pool and the same
   applicability / metric / basis / evaluation machinery (finding 32). No real row needed it — the
   escape hatch is exercised by the synthetic regression of finding 38: a constraint referenced only
   from the photovoltaic module's `bounds` fails that exact route (24.7 % > a synthetic 20 %) and
   never appears on any sibling route sharing the photovoltaic effect; a generic restatement
   (Carnot on the Rankine plant) and a benchmark (Curzon–Ahlborn) are refused.
4. The field is gone (finding 35): `Pathway.performance` is a strict object (`notes`,
   `measurements[]`) so none of the four legacy keys can return — a temp copy with a
   `theoretical_limit` line fails validation; the route page's "Theoretical relation" block is
   replaced by "Typed bounds on this route" (every constraint reached through `bounded_by` /
   `governed_by` claims on the route's entities or recorded in `bounds[]`, with its kind, whether the
   check treats it as a hard bound that applies here, its bound text and, for a pathway bound, its
   conditions, note and refs); the coverage check's dead summary branch and the `/methods` reads
   string (which carried the pass-37 typo "theoretical_limitity") are fixed; the data-API contract
   documents `bounds[]`, the strict object and the format history.
5. Bound results after the sweep: unchanged on all 35 rows where nothing was typed (gated); the six
   typed rows moved from unknown / unresolved-on-Landsberg to "hard bound recorded but not evaluable"
   (incandescent, fuel cell, photosynthesis, PEC) or gained a listed resource bound (capmix,
   concentration cell) — no datum on the matching basis exists yet, which is the honest state.

Result: revision a16833fcc7f7 — 347 entities · 517 claims · 226 sources · 92 pathways · 2 systems ·
761 routes · 86 demonstrated · 18 regime tokens · 80/80 · axe clean · exports valid · three audit
gates consistent · live.

## Reviewed (sent 7:31 pm; ChatGPT High, ~8 min, with web search; PIVOT — 46 findings)

1. Pass 42 accepted (finding 1): performance facts are measurements, physical limits are
   constraints, benchmarks are typed as benchmarks, and pathway-specific bounds have a narrow typed
   escape hatch rather than another prose channel. No data changed in this closing — the rulings
   are pass 43's build.
2. (B1) The MHD provider is not an annotation (findings 2–11): Smith 1979 exposes a missing
   transformation stage — the Mach-2 nozzle converts the hot pressurised combustion products'
   enthalpy and pressure availability into directed bulk kinetic flow before the MHD conversion.
   Add `phenomenon:gas-dynamic-expansion` (never widen `phenomenon:working-fluid-expansion`, whose
   output is shaft work), `claim:hot-gas-drives-gas-dynamic-expansion` (requires
   `thermodynamic:expansion-pressure-drop`; thermal → kinetic) and
   `claim:gas-dynamic-expansion-produces-flow` (→ `disequilibrium:fluid-flow`, which already provides
   the flow token); re-spell `pathway:mhd-generator` through them (seven claims); keep
   `claim:hot-gas-drives-mhd` and its searched routes as the compact generic spelling that stays
   unresolved on flow.
3. The new explanation kind is justified for the PRESSURE DROP, not the flow (findings 12–19):
   `Pathway.regime_establishments[]` = `{ token, kind: implementation-process, component?,
   explanation, evidence[] }`, defined as "a physical process or operating arrangement inside the
   named implementation that establishes a required regime but is not an off-route load/input and
   is not itself omitted when it constitutes a distinct source→sink conversion stage"; loader rules
   (the token in `regime_provides`; required somewhere on the route; registry
   `provider_needs_explanation: true`; evidence known; never doubling a preceding provider or an
   auxiliary's `establishes`); the PWR pumps stay `external-input`, the compressor
   `recirculating-work`. The exact combustion MHD route then REGIME PASSES.
4. Pass 43 = the MHD re-spelling ahead of source restoration (findings 20–21): the route count
   will move; report and classify every new route `gas-dynamic-expansion` generates
   (source-preparation, representation-equivalent or a genuine new composition).
5. (B2) Pass 44 = source restoration in this order (findings 22–36): the 2014 travelling-wave
   thermoacoustic electrical generator (18.4 % at 3.46 kW, 650 °C / 25 °C → 923.15 K / 298.15 K,
   evaluated against Carnot; Backhaus 2004 recorded only if its full text can be read); an open
   ⁶³Ni betavoltaic primary (7.31 % SiC — read the efficiency's denominator first); NREL's field
   test rotor C_p ≈ 0.45 as a `power-coefficient` datum, `datum_kind: derived`, on the Betz basis;
   DOE's Monroe Hydro 60 % water-to-wire once the denominator and grid boundary are read. PEC is
   bound-model curation, a separate pass (Fountaine 2016's 30.6 % single-junction / 40.0 % dual-
   junction maxima need `requires_basis` per architecture or a named tandem pathway; never divide
   Cheng's 19.3 % by 0.85); Planck integration waits for a datum with an emitter temperature.
6. (B3) Bump to v0.5.0 now (findings 37–46): the boundary is before pass 35 (the first schema
   contraction); freeze `/api/schema/v0.4.0.json` from the pass-34 contract recovered from that
   revision, immutable, hashed by a regression; build `/api/schema/v0.5.0.json` from the current
   contract after the pass-43 `regime_establishments` field lands; one migration boundary carrying
   the four removed keys, `Measurement.normalization` / `datum_kind` / `reference_constraint`,
   `Pathway.bounds` / `auxiliary_requirements` / `regime_establishments`, the system layer,
   `circular → same-form` and the token vocabulary; a compact v0.4 → v0.5 migration document; every
   export declares `version: "0.5.0"` and points at the new schema; `SCHEMA_VERSION`, the graph
   build version, the JSON Schema `$id`, README / API docs, validation tooling and CITATION.cff move
   together. Pass 44 is then a dataset revision under an unchanged format.
