# Reviewed search records

This directory holds the only records that may say **no demonstration found**: a person searched a
named index for a specific composition, read the hits, and recorded the outcome as a `SearchRecord`
(`packages/schema/src/index.ts`) — target (cell, route or claim), date, engine, query, works found,
the top hits, the result, and who reviewed it.

**The current revision has no reviewed search records**, which is why `/api/stats.json` reports
`paths_no_demonstration_found: 0` and every matrix cell without a direct relation reads *not
searched*. Automated OpenAlex runs are kept apart in `data/generated/search-runs.json`; they set a
route or cell to *search-incomplete* and are never promoted to *searched, no demonstration found*
without a person reading the hits.

Add a record by copying the shape below into a YAML list file in this directory; `pnpm validate`
rejects unknown targets and engines.

```yaml
- id: search:2026-09-21-d-04-c-11
  target: { kind: cell, row: disequilibrium:pressure-gradient, col: coupling:thermoelectric }
  date: 2026-09-21
  engine: openalex
  query: '("pressure gradient" OR "pressure difference") AND (thermoelectric OR Seebeck)'
  works_found: 212
  top:
    - { title: "…", year: 2019, doi: 10.xxxx/xxxxx }
  result: no-demonstration-found
  reviewed_by: your name
  notes: what was searched for and what the hits actually were
```
