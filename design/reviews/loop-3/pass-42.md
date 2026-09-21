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
