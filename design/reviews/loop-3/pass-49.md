# Pass 49 — the frontier searches, at their true completeness (21/09/2026 11:20 pm–12:05 am Sydney, build; message after)

Built on the reviewer's pass-48 rulings (findings 6–21): route-search-v1 unchanged; every mandatory engine
attempted and every attempt recorded as what it was; the ten records rewritten to their actual
completeness; obligations recomputed rather than trusted.

## Built

1. The engines, tonight (21/09 11:29 pm Sydney): every planned Semantic Scholar query for the ten
   default-frontier candidates attempted once through the anonymous pool — 43 queries, 42 answered
   HTTP 429 at the first request (no Retry-After), one (p-231472e45e's demonstration-precision form)
   answered with an empty list, a completed run with nothing to screen; Google Scholar loaded once per
   route with a compact driver-mechanism form — its bot check (form#gs_captcha_f) at the first page every
   time, never completed by the lane; the captcha page's header count is not recorded as a result count.
   The API key stays an owner decision (exception e953).
2. The ten reviewed records: each attempt appended as a run with its literal query, key, execution time,
   request URL, `result_count_reported: null`, nothing retrieved or screened, `positions_screened: none`
   and an `interruption` naming the blocker; the one answered query as a completed run with
   `result_count_reported: 0` and no interruption; a pass-49 limitation on every record naming the
   outstanding mandatory engines (the Semantic Scholar runs for every mandatory key; the Google Scholar
   runs to the protocol depth) and stating that a blocked request is evidence of an attempt, never of an
   empty result. Every record stays inconclusive · partial.
3. The loader (packages/graph/src/load.ts): a run that obtained no result list is an attempt — it counts
   toward no engine's and no key's coverage; a blocked run may never carry `result_count_reported: 0`;
   the segments of one mandatory run (the same engine and key over several sittings) add their screened
   positions together — the union of their stated positions, else the sum of their counts. Three
   regressions in search-record.test.ts: a negative over OpenAlex twice + blocked S2 + Scholar is refused
   naming semantic-scholar and every key (and refused again when the blocked runs claim an empty list);
   Scholar segments 1–40 and 41–100 complete a run where a repeated 1–40 does not; an empty
   composition_terms array requires no composite-name run, one frozen term makes it mandatory on every
   discovery engine.
4. `tools/audit-frontier-searches.mjs` → `pass-49-frontier-search-audit.md` (gated in the suite):
   every default-frontier candidate's record with its obligations recomputed from its target — the
   three mandatory engines × the keys for its k phenomena, composite-name only when a source-backed term
   is frozen, depth per engine × key with segments added, two chases — and the state the atlas can
   honestly claim: demonstration-found 0 · protocol-complete-negative 0 · partial/blocked 10, each naming
   its outstanding engine, key and depth. The recomputation surfaced depth shortfalls the stored labels
   had hidden: p-41cb505083's Scholar whole-chain 59 of 68 and precision 44 of 53, p-423a19acdd's
   whole-chain 95 of 100 and precision 69 of 79, p-1043a15e01's driver-mechanism 10 of 100, and
   p-231472e45e's two citation chases not made. The gate refuses a partial with no outstanding
   obligation (it should have been reviewed as a negative) and a negative with any.
5. The site: a record's header counts obtained runs and names blocked attempts as "attempted, never
   counted", with the engines; the engine list of a record excludes attempts. The protocol README
   records the blocked-attempt semantics as a clarification dated 21/09/2026 with the mandatory engines
   and forms unchanged.
6. Pass-48 close (finding 5): the two ideal-limit claims' review lines and the Rozzi source note say what
   "established" means here — a review restating Fountaine's calculation, citing it; not an independent
   replication.
7. Regressions: the pass-49 test (the gate; every record's attempts, their null counts and their
   blockers; the one answered query; composite-name applicability; the surfaced shortfalls) and the three
   loader tests. 92/92.

Result: revision 7719df505447 — 353 entities · 524 claims · 235 sources · 93 pathways (92 + 1 variant) · 2 systems ·
771 routes · 86 demonstrated · 92/92 · axe clean · exports valid · seven audit gates consistent · live.
