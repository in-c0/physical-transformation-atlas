# Working in this repository

Read `README.md` first, then `docs/`. Short rules that are easy to get wrong:

- `data/canonical` is the only hand-edited knowledge. `data/generated/*.json` and `apps/web/generated/` are outputs; regenerate them with `pnpm build:graph`, never edit them.
- A claim is `subject —predicate→ object` with conditions, evidence and a status. Do not add a relation without at least one source in `data/canonical/sources`. Do not mark anything `established` from memory; if you cannot cite it, use `hypothesised` and say so in `notes`.
- Only a reviewed record in `data/canonical/searches` may make a cell or route say "no demonstration found". Automated index runs go to `data/generated/search-runs.json` via the pipeline and remain not-reviewed: they may produce `search-incomplete` but can never produce `no-demonstration-found` or a canonical claim.
- Do not manufacture review provenance: `review.last_reviewed` changes only when that record was actually re-read; generated records inherit `data_hash` / `source_commit`, not a review date.
- Rows and columns of the matrix are numbered in file order. Append new disequilibria and coupling families at the end of their files; never reorder.
- Units used in a claim's `relation.coefficient_unit` must exist in `data/canonical/ontology/units.yaml`; condition tags must exist in `ontology/conditions.yaml`.
- Run `pnpm validate`, `pnpm build:graph` and `pnpm test` before committing data changes. `pnpm --filter @pta/pipelines inspect fails` explains every route that fails a check.
- Visual values in `apps/web` come from `design/DESIGN.md`. No new colours, fonts, shadows or motion outside that file.
- Language on the site reports the state of the atlas, not the state of nature. Use the canonical strings in `design/DESIGN.md` under "State language".
- Verify the built site with `node tools/verify.mjs` (headless Edge, screenshots to `design/current/`) rather than describing it.
