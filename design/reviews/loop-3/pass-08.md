# Pass 8 — the atlas as a dataset (20/09/2026 ~1:10–2:30 pm Sydney)

Focus sent: judge the public data surface for a researcher who wants to reuse the atlas without
reading the site — is each export self-describing, are ids and URLs citable, what is missing for
reuse (licence marker, citation, changelog, schema, provenance, flat claims table, check registry),
and does anything in the exports contradict the docs. ChatGPT (High, ~5 min). Verdict: PIVOT — 10
findings.

Mechanics: the first send of this pass was lost when Chrome froze the temporary-chat tab at the end
of the reply (see design/LOG.md, 1:05 pm). From this pass the loop runs in a regular chat, with a Web
Lock held to opt the tab out of background freezing; the reply came back intact.

## Findings (condensed) and what was done

1. Only stats and graph carried build metadata; the other exports were bare arrays. → Every export is
   `{meta, data}` with `version`, `data_hash`, `generated_at`, `source_commit`,
   `search_indexed_through`, `record_kind`, `records`, `counts`, `schema`, `license`, and links to the
   citation, contract, changelog, vocabulary and check registry (`apps/web/lib/api.ts`).
2. graph.json emitted `paths: []` while its meta counted 589 routes. → Removed; `links.paths` names
   the routes file.
3. README counts were a revision stale; the matrix footer printed the build time as "indexed
   through". → README paragraph regenerated from the build; `meta.search_indexed_through` (max search
   record date, or null) is what the footer shows.
4. `review.last_reviewed` was a schema default (`2026-09-19`) on all 444 claims and 64 pathways —
   provenance that the records did not contain. → `ReviewMeta` with `last_reviewed: null` by default
   on claims, pathways, entities and sources; the 29 records the pass-7 audit re-read carry a real
   date and reviewer line; generated records carry `record_kind: generated` in the envelope instead.
5. Docs listed nine evidence statuses without saying which occur; `not-indexed` existed in the
   schema with no producer. → Occurrence maps in `counts` (claims by status and predicate, paths by
   search status, frontier class and structural kind, cells by status, entities by type);
   `not-indexed` removed; status-model.md says vocabulary ≠ occurrence and points at stats.
6. No reuser-facing contract; the methods page listed six of the exports. → `docs/data-api.md`
   (envelope, endpoints, records, null semantics, ids and canonical URLs, revisions); methods page
   lists all fourteen exports; README links the contract, schema, changelog, licensing and citation.
7. No machine schema. → `packages/schema/src/export-schema.ts` generates one JSON Schema (25 `$defs`)
   from the zod definitions, served at `/api/schema/v0.2.0.json`; `tools/validate-exports.mjs`
   validates every built export against the definition its own `meta.schema` names, with a negative
   control; a pipelines test validates every compiled record.
8. Claims had no canonical page; no `canonical_url` in exports. → `/claim/[slug]` and `/source/[slug]`
   record pages with cite blocks; `canonical_url` on every claim, entity, source, route and cell;
   pathways carry `route_id`; the compiler now fails on a route-id collision.
9. No CITATION.cff, changelog or licence statement. → `CITATION.cff`; `docs/licensing.md` with the
   exact PENDING OWNER RULING sentence (licence choice is the owner's — exception
   `2026-09-20-physical-transformation-atlas-licensing-8590`); `docs/dataset-changelog.md` generated
   by `pnpm changelog` from a revision index (counts, deltas, ids added/removed, hand-written notes).
10. Claims only as nested JSON; checks only as code. → `/api/claims.ndjson`, `/api/claims.csv` with
    the specified columns, `/api/checks.json` registry (`label`, `definition`, `pass_when`,
    `fail_when`, `unresolved_when`, `unknown_when`, `reads`, `core`, `implementation`);
    `data/canonical/searches/README.md` states that this revision has no reviewed search records.

Also this pass: `/api/vocabulary.json` and generated `docs/vocabulary.md` (116 terms, sync test);
`.prettierrc` at 200 columns so pass-6 files return to the repository's line style.

Not applied: a `.d.ts` export beside the JSON Schema (the TypeScript types are in the public repo and
the schema is the contract); `provenance` objects on every generated record (the envelope carries it
once instead of 1,486 times).

Result: revision r58d98b9384c9 · export format v0.2.0 · 14 endpoints, all valid against the served
schema, live · 24/24 tests · axe clean.
