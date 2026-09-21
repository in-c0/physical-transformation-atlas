# Physical Transformation Atlas

A live map of known and unexplored pathways for converting physical disequilibria into useful work.

The atlas does not list energy sources. It records evidence-backed claims about physics — a temperature gradient drives the Seebeck effect, under these conditions, according to these sources, with this status — and compiles them into every conversion route they compose. Each route is passed through seven physics checks and marked with what has actually been searched. The interesting part of the map is the empty squares: disequilibrium × coupling-family pairs where every constituent relation is established and nobody appears to have demonstrated the composition.

The current build examines 589 routes from 23 disequilibria across 39 coupling families, built from 444 claims citing 152 sources (every DOI matched against Crossref). 64 routes are demonstrated, 51 are candidate compositions whose exact composition has not been assessed, and 334 more extend or truncate a recorded pathway. Live counts: [/api/stats.json](https://physical-transformation-atlas.wldud5192.workers.dev/api/stats.json).

## Layout

```
data/canonical/      reviewed knowledge, YAML, the only thing that is edited by hand
  entities/          quantities, disequilibria, phenomena, carriers, couplings, transducers, constraints, materials
  claims/            subject —predicate→ object, conditions, energy ledger, relation, evidence, status
  sources/           references; DOIs are verified against Crossref
  pathways/          named, reviewed compositions with measured performance
  interfaces/        physical boundaries between two regions of a device (pass 26)
  systems/           multi-route systems joined by documented handoffs — a topping cycle sourcing a bottoming cycle (pass 34)
  searches/          reviewed literature searches (the only records allowed to say "no demonstration found")
  ontology/          units (for dimensional analysis), domains (for coverage), condition tags and conflicts
data/generated/      compiled graph, Crossref verification, automated OpenAlex index queries
packages/schema      zod schemas and the vocabulary
packages/physics     dimensional analysis and the eight route checks
packages/graph       loader with referential validation, compiler, browser-safe query index
pipelines/           validate · build-graph · verify-sources · literature-search · inspect · tests
apps/web             Next.js static site: /, /atlas, /matrix, /path/[id], /system/[id], /phenomenon/[id], /frontier, /coverage, /methods, /api/*.json
worker/              Cloudflare Worker serving the static export
design/              brief, design system, review transcripts, current screenshots
docs/                ontology, evidence model, status model (derivation and precedence), candidate generation, worked example, generated vocabulary
tools/               static server and headless verification (screenshots, keyboard model, axe-core)
```

Dataset contract: [docs/data-api.md](docs/data-api.md) · machine schema: `/api/schema/v0.5.0.json` (v0.4.0, v0.3.0 and v0.2.0 frozen; migration: [docs/migration-v0.4-to-v0.5.md](docs/migration-v0.4-to-v0.5.md)) · revision history: [docs/dataset-changelog.md](docs/dataset-changelog.md) · reuse terms: [docs/licensing.md](docs/licensing.md) (none declared yet) · how to cite: [CITATION.cff](CITATION.cff).

## Run it

```bash
pnpm install
pnpm validate            # referential integrity of data/canonical
pnpm build:graph         # data/canonical → apps/web/generated/{graph,paths}.json, and docs/vocabulary.md
pnpm test                # physics and compiler invariants, with negative controls
pnpm dev                 # next dev on http://localhost:3000
pnpm build               # static export to apps/web/out
node tools/verify.mjs    # headless screenshots + overflow/console probes of the export
pnpm deploy              # build, then wrangler deploy from worker/
pnpm changelog --note "…" # record the current data_hash in docs/dataset-changelog.md (run after committing data)
```

Pipelines that talk to the outside world:

```bash
pnpm --filter @pta/pipelines verify-sources       # Crossref, writes data/generated/source-verification.json
pnpm --filter @pta/pipelines literature-search    # OpenAlex, writes data/generated/search-runs.json
```

## Adding to the atlas

1. Add or edit YAML under `data/canonical`. Every entity id is `<type>:<slug>`; every claim cites at least one source; every process claim (`drives`, `produces`, `couples_to`, `converts_into`) should declare its energy ledger and, when a constitutive relation exists, the relation with its coefficient unit.
2. `pnpm validate` — unknown entities, sources, tags and units are rejected with the file and record named.
3. `pnpm build:graph` and read the summary line: how many routes, how many fail a check and which. `pnpm --filter @pta/pipelines inspect fails` prints every failing route with the sentence explaining why.
4. `pnpm test`.
5. Open a pull request. The dataset revision in the status rail is a hash of the canonical files, so reviewers can confirm they are looking at the same build.

Rows and columns of the matrix are numbered in file order. Append; do not reorder. `D.04 × C.11` is meant to stay a stable address.

## What "not searched" means

The atlas separates how well a relation's physics is known from whether anyone has looked for a demonstration of a composition. A cell can only say *no direct demonstration found* when a reviewed search record in `data/canonical/searches` says so. Automated index runs are stored separately as frozen result lists and are never promoted without a person reading the hits; a cell or route with such a run, or with a reviewed search left partial or blocked, says *search incomplete, not decided*. Everything else says *not searched*. How every public state is derived: [/methods](https://physical-transformation-atlas.wldud5192.workers.dev/methods).

## Status

Version 0.1, first release. The representation has been tested on thermal, mechanical, electromagnetic, chemical and radiative conversions. Nuclear, plasma, quantum-transport and biophysical domains are deliberately thin. See `/coverage` on the site for the numbers and `/methods` for the model.

## Origin

Designed in a conversation that started with "in theory, we should be able to turn anything in the world into energy, correct?" and ended with the plan for this repository; the verbatim thread is in `research/brief/`.
