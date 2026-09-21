# Pass 47 — the generalised stage-omission audit (21/09/2026 10:12–10:41 pm Sydney, build; message after)

Built on the reviewer's pass-46 order (findings 10–16): the wider proper-subsequence relation as a
generated, gated report — never a classifier, nothing served — with each omitted stage's contribution
decomposed mechanically; and finding 8: a variant pathway's own address.

## Built

1. `tools/audit-stage-omission.mjs` writes `pass-47-stage-omission-audit.md` from the compiled graph. A
   route is a shorter spelling of a recorded demonstrated pathway when both share the source and sink
   entity and the route's ordered phenomena are a proper ordered subsequence of the pathway's; phenomenon
   matching only generates the hits. For each hit: both ids, both phenomenon sequences, the omitted steps'
   positions and claim / phenomenon ids, and the claims the route spells its shared stages through when
   they differ from the pathway's; each omitted step's contribution by channel — `regime_provides`, the
   tokens of the disequilibrium it produces, `handoff.provides`, `regime_external` — with every downstream
   consumer of each token (a later pathway step, or a route-only claim at a later stage: the compact MHD
   route consumes flow:bulk-fluid-motion on claim:hot-gas-drives-mhd, which the pathway never uses) and what
   the shortened route does about it (unresolved by the compiler's own detail; replaced by a named
   provider — the source, a preceding step's regime or handoff provides, the produced disequilibrium, or a
   declared external; consumed only by a step the route omits too; no consumer); pathway-level
   establishments, auxiliaries and the exact pathway's own provides listed separately as what no candidate
   inherits; `candidate_without_omitted_stage` = unresolved / resolved / not-represented; the class —
   omission creates an unresolved requirement (the only evidence for the stage-omission relation), the
   omitted provider is replaced elsewhere, no relevant requirement is represented; and a step table of the
   whole pathway with each claim's subject → object, in-route flag, conditions, regime and handoff tokens.
2. Three scopes: the default frontier (class candidate, kind composition — 10 routes, 0 hits); beyond it,
   every route neither demonstrated nor already derived by stage-omission (674 routes, 2 hits); and the
   positive control, the routes the compiler derived by stage-omission (1, found with its token).
3. The two hits beyond the default view: the waterwheel-generator spelling of the hydroelectric plant
   (p-dfe0c609d9, candidate / representation-equivalent — the omitted turbine's lift step supplies
   motion:relative-flux-change, which claim:descent-produces-waterwheel-motion's handoff supplies instead:
   replaced, the route stands as a different spelling of the same physics) and antenna reception →
   electricity without rectification (p-f64f7f0a7b, candidate / atomic — the omitted stage records no
   token in any channel; the report keeps the conditions that carry the physics, "an oscillating current at
   the wave frequency" against "direct current out of the diode", for the reviewer to rule on; the ends
   differ, so the compiler's condition never considers it).
4. Gate (`--check`, in the suite, with `pass-47-controls.yaml`): the three controls hold — the MHD route
   reads unresolved on flow:bulk-fluid-motion with gas-dynamic expansion omitted and the compiler's
   stage-omission agreeing; the hydro hit reads replaced, naming the waterwheel-motion claim; the antenna
   hit reads not-represented — every compiler stage-omission route is found with its token; no hit in the
   first two scopes meets the compiler's decisive condition; the report on disk matches the graph.
5. Finding 8: `/pathway/{slug}` pages for variant pathways (`VariantView`): the complete record — status,
   maturity, demonstrated-with, review, the eight checks evaluated for the variant, every measurement with
   its conditions, basis, metric and datum kind, the derived best, the architecture-specific bounds with
   the constraint's bound text and conditions, the parent's steps, the numbered evidence and a cite block.
   The route page's variant section links to it; a variant's search hit and its `canonical_url` in
   /api/pathways.json point to it (`route_id` stays the parent's route; the canonical_url rule says so).
6. Pass-46 close (findings 4–5, 9): the four generic PEC claims cite Fountaine alone (status `reported`
   under the evidence model); the pair constraint's summary keeps Cheng's SQwater and Fountaine's Ideal
   bundles distinct, with Fountaine's own 22.8 % (20.5 % Real1) for the May 1.26 / 1.78 eV pair verified
   on p. 8 of the full text.
7. Regressions: the pass-47 test (the gate; the three controls' lines in the report; both hits stay
   candidates; exactly one stage-omission route; the four claims' evidence and status; the summary's
   wording; the variant's bound evidence). 87/87.

Result: revision 7d644689086f — 353 entities · 524 claims · 234 sources · 93 pathways (92 + 1 variant) ·
2 systems · 771 routes · 86 demonstrated · 87/87 · axe clean (the variant page and the PEC route added
to the probe) · exports valid · five audit gates consistent · live.
