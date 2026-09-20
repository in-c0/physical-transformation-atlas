# Pass 15 — the methods page as the trust document (20/09/2026 ~6:15–7:06 pm Sydney)

Focus sent: /methods read as the document a sceptical physicist uses to decide whether to trust any
number on the site — stale sentences against the deployed revision, section order, the language
rule, duplication with `docs/*`, and what was missing (a worked derivation, thresholds, enumeration
limits, what the atlas does not do). Asked for exact deletions, exact replacement text, an exact
section order and the first paragraph of each new section. ChatGPT (High, ~8 min, same regular chat
as pass 14). Verdict: PIVOT — 15 findings.

Every technical claim in the reply was checked against the code before it was written into the
page (`build.ts` enumeration bounds, matrix precedence, frontier classing, `magnitudeScreen`,
`researchOrder`, the loader's negative gate, `checks.ts` result paths, the five home readouts).
Two claims were adjusted: the gate does not machine-check the citation chase (the protocol requires
it; the page says so), and "index-only search" is in fact "any other search record" — a reviewed
partial record also yields `search-incomplete`, which exposed a wrong label (below).

## Findings (condensed) and what was done

1. Lead + language rule → the specified lead verbatim; §10 "Language" deleted; the rule is obeyed by
   wording, not repeated as a slogan.
2. Section order → exactly the thirteen sections specified, with a numbered section list at the top.
3. Canonical unit / route construction → both specified paragraphs verbatim; the enumeration bounds
   are read from the graph (`meta.enumeration`, new), not typed.
4. Five state layers → the specified opening paragraph, then each field's values rendered from the
   generated vocabulary with this revision's occurrence count beside each (× 0 shown honestly).
5. Candidate → the specified paragraph, plus the matrix precedence as the code has it: direct →
   forbidden row → reviewed direct demonstration → qualifying composition bridge → reviewed negative
   → search incomplete → not searched.
6. Seven checks → rendered from `CHECK_DEFINITIONS` (definition + pass/fail/unresolved/unknown +
   reads, core marked). `definitions.ts` fixed: dimensional's `unresolved_when` said "not used"
   although `checkDimensional` returns it; conservation's omitted conditional exergy; the bound's
   `pass_when` did not admit "no efficiency recorded to compare". The magnitude paragraph verbatim.
   New `definitions.test.ts`: every (check, result) pair the compiled dataset produces must have a
   description that is not "not used"; the two unexercised results pinned with synthetic routes.
7. Evidence → the hypothesised exception stated; thresholds rendered from the vocabulary with the
   two tested minimums; constituent vs composition sources kept; `evidence-model.md` gained the
   same thresholds list as the canonical authoring text.
8. Search records → the specified paragraph verbatim, then the gate as enforced (citation chase
   marked protocol-only); `searches/README.md` step 5 gained `route-only` with its definition.
9. Home counts → the specified paragraph with the live numbers inline; coverage linked.
10. Worked example → the specified first paragraph with every id, count and status read from the
    records; four fragments (source YAML claim, generated route, matrix consequence, named pathway)
    generated from the data; the build throws if the example stops matching the records. Longer
    version in `docs/worked-example.md`.
11. Limits + non-goals → both specified paragraphs verbatim; the patent-queue / publication-policy
    paragraph deleted (no such policy exists) and replaced by an explicit "no review queue".
12. `status-model.md` rewritten as the derivation/precedence document (no dictionary); the stale
    candidate/derived/matrix rules replaced; `candidate-generation.md` gained the exact research
    order, the source-preparation wording and an "Enumeration limits" section.
13. `data-api.md` graph.json now lists `search_runs` and `ontology`; AGENTS.md: automated runs
    "remain not-reviewed … may produce search-incomplete but never no-demonstration-found or a
    canonical claim"; new provenance rule (`last_reviewed` only on a real re-read).
14. Canonical owners assigned: vocabulary.ts → vocabulary.md + /api/vocabulary.json for enum wording;
    CHECK_DEFINITIONS → /api/checks.json for check semantics; evidence-model.md for thresholds;
    searches/README.md for the protocol; candidate-generation.md for the algorithm; data-api.md for
    reuse; status-model.md for precedence only. /methods links to each and renders the generated ones.
15. Citation and data access → the specified paragraph verbatim with the live `data_hash`; every
    endpoint linked.

Beyond the reply, two honesty defects surfaced by checking it:

- `search-incomplete` was labelled "Index queried · not reviewed" everywhere, but D.04 × C.01 carries
  a *reviewed* partial record and still (correctly) sits in that state. Labels are now "Search
  incomplete · not decided" (cell, short, route, legend, composition state); the vocabulary
  definitions for both the path and the cell value say what the compiler does; DESIGN.md's state
  language gained the string.
- Four schema search statuses (`candidate`, `under-review`, `experiment-proposed`,
  `experiment-tested`) are never assigned; the vocabulary now says "reserved; not produced by the
  current compiler (no review queue exists in this release)" instead of describing a queue.

Export format v0.2.0 → v0.3.0 (`meta.enumeration` added; nothing renamed or removed). The v0.2.0
schema file is frozen under `apps/web/public/api/schema/` so older exports' `meta.schema` URLs still
resolve; `data-api.md` records the format history. Inline links inside `.prose` on /methods now carry
a hairline underline (they were hover-only).

Result: 47/47 tests, axe clean on 16 pages at 1440 and 375, no overflow, exports valid against the
served v0.3.0 schema (negative control ok), live: /methods, /api/stats.json (v0.3.0, enumeration
block), both schema URLs 200.
