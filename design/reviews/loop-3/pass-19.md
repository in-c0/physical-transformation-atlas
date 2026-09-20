# Pass 19 — the seven physics checks audited as physics and as instruments (21/09/2026 ~12:35–1:50 am Sydney)

Focus sent: the result distribution of the seven checks over the 742 routes — no route fails any
check; the dimensional check can never pass (bookkeeping steps never carry a relation); the
thermodynamic bound "passes" on the presence of a constraint name, lists Onsager reciprocity as a
bound, and never evaluates Carnot; 23 of 67 thermal routes unresolved for want of a Carnot claim;
the conflict list and exergy tally — with the request for exact rule changes, data changes, how to
evaluate formula bounds from recorded temperatures, which pathways to test the fixed checks on, and
whether an eighth check is warranted. ChatGPT (High, ~12 min). Verdict: PIVOT — 15 findings.

## Applied

- **Thermodynamic bound is a typed evaluator** (findings 4, 5, 7, 8). Constraints now carry
  `constraint_kind` (upper-bound / formula-bound / resource-bound / constitutive-relation /
  benchmark), `metric`, `formula` + `formula_inputs`, `requires_basis`, `reference_value` /
  `reference_regime` and the applicability filters `applies_to_sources` / `_outputs` /
  `_phenomena`. Measurements carry `value_numeric`, `unit`, `metric`, `basis`, `parameters`. Only a
  hard bound that applies to the route and can be fully evaluated against a comparable datum of the
  same metric may pass or fail; a name is never a pass. Carnot is a formula bound evaluated from
  the datum's own recorded T_h and T_c (a small arithmetic evaluator; no `eval`); Landsberg is the
  temperature formula with 0.933 kept as a reference value; the ZT bound needs T_h, T_c and ZT;
  Shockley–Queisser requires the datum's basis "single-junction cell, unconcentrated AM1.5G, 298 K";
  Betz is a power-coefficient bound that a system efficiency is never compared with; Curzon–Ahlborn
  is a benchmark and can never fail a route; Onsager becomes Onsager–Casimir
  (`L_ij(B) = ε_i ε_j L_ji(−B)`), a constitutive relation recorded with `governed_by` on all six
  claims and never an applicable bound; the radiation momentum flux, Nernst/Gibbs, mixing free
  energy, radiative-cooling power and the second law are resource bounds listed as recorded limits.
  Carnot is recorded once at the source (`claim:temperature-gradient-bounded-carnot`, scoped by the
  constraint to work-like outputs) instead of on 23 phenomena (finding 6).
- **Dimensional** (finding 9): `relation_requirement` per claim, defaulting by predicate (drives /
  couples_to unknown, produces / converts_into not-applicable); pass = every conversion step carries
  a relation and all balance; the site text names the conversion steps without one.
- **Source work availability** (finding 3): the check named `conservation` says what it examines,
  drops the epistemic (contradicted / invalid) rule, and its pass sentence states that no
  quantitative balance is recorded.
- **Energy-form continuity** (finding 2): a step fed by a carrier must take the form the carrier
  carries (the subject-side comparison was missing).
- **Measured performance coverage** (finding 12): renamed from practical magnitude; pass needs a
  structured datum (value, unit, regime, source); summary figures alone are unresolved; a
  conversion efficiency outside [0, 1] fails.
- Two same-medium temperature conflicts added (`temp-cryogenic × temp-room`, `temp-room × temp-high`).
- Structured data where the atlas already recorded the temperatures from the sources: the TEG's
  12 % at 850/300 K and ≈ 6 % at 500/300 K modules and the RTG's ≈ 7 % at 800/470 K.
- Regression tests (finding 13/14): TEG passes with Carnot evaluated (12.0 % ≤ 64.7 %); Rankine
  0.47 is unresolved and never fails on a Curzon–Ahlborn benchmark; the wind turbine's 0.52 is a
  system efficiency, so Betz stays unresolved; the PV module's 0.27 states no SQ basis; the rectenna
  acquires neither Landsberg nor SQ; synthetic controls for a datum above Carnot (fail), below
  (pass), without temperatures (unresolved), a benchmark alone (unknown), zero-exergy source (fail),
  a contradicted step (no longer a conservation failure). 59/59.
- Result distribution now: thermodynamic bound 1 pass (the TEG) · 548 unresolved · 193 unknown;
  dimensional 10 pass · 133 unresolved · 599 unknown; coverage 1 pass · 74 unresolved · 667 unknown;
  still 0 fails — but every remaining pass has decided something. Export format v0.4.0 (v0.3.0
  frozen); /methods and the worked example say what changed.

## Deferred (explicitly, for a later pass)

- Region-scoped condition requirements and the rewritten boundary rule (findings 10–11): the
  present flat conflicts stay, because removing them without regions would make the boundary check
  emptier; the reviewer's list of conflicts that are not universal is recorded here for that pass.
- The eighth check, driver/regime sufficiency (finding 15), with `requires` / `provides` condition
  scopes and the pyroelectric `temporal-temperature-change-required` case.
- Structured temperatures for the other thermal pathways (steam engine, Rankine, gas turbine, OTEC,
  thermoacoustic …): each needs its source re-read for the regime of the quoted efficiency; not to
  be typed from memory.

Revision r2885572501ab · 473 claims · axe clean · exports valid against v0.4.0 · live.
