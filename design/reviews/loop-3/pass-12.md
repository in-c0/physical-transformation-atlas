# Pass 12 — the reviewed literature-search record (20/09/2026 ~3:55–4:36 pm Sydney)

Focus sent: 894 of 897 cells have no search record, so the record format decides whether the
searches to come will be trustworthy. Design the record and the protocol; write the complete first
reviewed record for D.01 × C.23 from what can actually be found; say how the record should change
the drawer, the route page and the frontier row; and what the automated OpenAlex runner must record
so a run can be promoted without re-running. ChatGPT (High, ~9 min). Verdict: PIVOT — 12 findings.

Mechanics: the regular-chat tab froze at the end of this reply as well; the renderer process was
killed and the conversation reloaded, and the reply survived in React state. Noted in the lane memory.

## Findings (condensed) and what was done

1. `SearchRecord` was one `{engine, query, top[]}` tuple. → A review package: `protocol_version`,
   `started_at`/`completed_at`, `objective`, inclusion/exclusion criteria, `runs[]` (`SearchRun`:
   engine, query form, the literal query, timestamp, request URL, index snapshot, filters, reported
   count, retrieved/screened/read), de-duplicated `screening` totals, `hits[]` (`ReviewedHit` with
   one of ten decisions and a reason), `result`, `completeness`, `reviewed_by`, `reviewed_on`,
   `limitations`, `conclusion`, `source_run_ids`, `follow_up`. `works_found` is gone.
2. "No demonstration found" must be schema-gated. → The loader refuses it unless completeness is
   `protocol-complete-negative`, a reviewer is named, no hit qualifies, and the runs cover OpenAlex +
   Semantic Scholar + Google Scholar and the three mandatory query forms; a positive needs a
   qualifying hit, `conclusive-positive` and a `follow_up`. Tests include two negative controls
   (a one-engine negative is rejected; a positive without a qualifying hit is rejected) and one
   protocol-complete negative that passes.
3–4. Protocol and qualification rules. → Written into `data/canonical/searches/README.md`
   (`cell-search-v1`): term construction from recorded aliases, the query bundle, screening depth,
   citation chase, the four conditions a cell demonstration must meet, and how a chain belongs to a
   route search instead.
5–7. The worked example. The reviewer expected a negative and found a positive: Zhao et al. 2020
   (Nanoscale Advances, 10.1039/D0NA00429D) measured a streaming current rising to 14 nA at ΔT = 47.5
   °C across a track-etched polyimide nanochannel membrane between hot and cold reservoirs, with the
   temperature difference as the sole imposed driver. Before writing the record I resolved all five
   DOIs against Crossref and read the method in the open-access full text (PMC9419229): a fabricated
   membrane, a measured current, no pressure or bias as driver. The four rejected hits (Dietzel &
   Hardt 2017 theory; Ghonge 2013 theory; Prakash 2020 MD simulation; Bregulla 2016 thermo-osmotic
   flow, wrong coupling) are recorded with reasons. Committed as
   `data/canonical/searches/2026-09-20-d-01-c-23.yaml` — the atlas's first reviewed search, a
   conclusive positive with `follow_up.canonical_claim_review: needed` and a candidate claim
   (temperature gradient drives the streaming potential) left for a separate data review.
8. `follow_up` block. → In the schema and required by the gate for every positive.
9–10. Copy. → `SearchRecordView` in the drawer: "Reviewed search · date · engines", the specified
   negative sentence with screened/read counts and the provenance caveat, the positive sentence with
   the qualifying paper and "the atlas has not yet decided whether this warrants a new canonical
   direct-relation claim", every rejected hit as title · decision · reason; automated runs show as
   "Index query only · not reviewed" with the frozen-list note; route pages use
   `searchRouteSentence` with the provenance line; the frontier compact forms.
11–12. The runner. → `literature-search.ts` rewritten to emit `AutomatedSearchRun`: the same
   bundle as the human protocol (driver × family, driver × each member phenomenon, precision), up to
   100 works per query with OpenAlex id / DOI / title / year / type / citation count / OA URL, the
   literal query, the request URL with `mailto` stripped, timestamps, `dataset_hash`,
   `screening_status: not-reviewed`. The three v0.1 runs were migrated and marked for re-run.

The D.01 × C.23 cell now reads *Demonstrated* from the reviewed search; the matrix header says how
many reviewed searches exist (1) beside the 893 cells with none.

Result: 1 reviewed search · 3 automated runs · 42/42 tests · exports valid · axe clean on 16 pages,
live.
