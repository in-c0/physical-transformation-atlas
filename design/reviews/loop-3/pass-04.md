# Pass 4 — the frontier as a research tool (20/09/2026 ~10:35 am Sydney)

Focus sent: a better default ordering using compiler fields; the missing fields per entry; compiler-detectable
uninteresting candidates (rules, not a list). ChatGPT (3m 15s; the Worker JSON was unreachable from its
sandbox so it reasoned from the repo). Verdict: PIVOT.

## Findings (condensed)

- `established/length` rewards long routes; separate "how trustworthy is the weakest part" from "how
  complicated is the composition".
- Use a lexicographic research-priority tuple, no synthetic score: structural novelty gate → resolution of the
  four core checks (energy continuity, conservation, bound, boundary; `type-chain` is invariant and
  `practical-magnitude` is structurally unknown for fresh compositions) → evidence floor and count of
  non-established constituents → mechanism novelty (one or two real cross-family seams first; seams counted
  as adjacent phenomena with disjoint family sets) → composition-search strength → source availability
  (curated per driver) → effective length (phenomena, not claims) → overlap → id.
- Missing fields: mechanism core (phenomenon count, ordered phenomena, seams, energy-form sequence);
  interface/regime burden (implied interfaces); a magnitude/bottleneck prior (start with constitutive-relation
  coverage).
- Uninteresting-candidate rules: `atomic` (fewer than two phenomena); `representation-dominated`
  (superpath adding no seam and no transition); `representation-equivalent` (same mechanism core as a
  recorded pathway at another graph resolution); `energy-backtracking` (A → B → A); `known-device-likely`
  (all phenomena share a K6+ transducer). Keep them searchable, not on the fresh frontier.
- Four synthetic compiler tests; then record the histogram.

## Applied

All of it (commit 26e58d2). Histogram of candidate-class routes: 68 composition · 20 atomic ·
18 energy-backtracking · 8 carrier-expanded copies; 6 representation-equivalent routes among the derived class
(e.g. gravity → descent → flow → lift → generator ≡ hydroelectric plant); known-device-likely: 0.
