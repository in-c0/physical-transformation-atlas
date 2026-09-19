# Physical Transformation Atlas

A live map of known and unexplored pathways for converting physical disequilibria into useful work.

The atlas does not list energy sources. It records evidence-backed claims about physics — a temperature gradient drives the Seebeck effect, under these conditions, according to these sources, with this status — and compiles them into every conversion route they compose. Each route is passed through seven physics checks and marked with what has actually been searched. The interesting part of the map is the empty squares: disequilibrium × coupling-family pairs where every constituent relation is established and nobody appears to have demonstrated the composition.

The current build examines 459 routes from 22 disequilibria across 31 coupling families, built from 384 claims citing 100 sources (all 84 DOIs matched against Crossref). 62 routes are demonstrated; 319 are candidate compositions with no demonstration on record.

## Layout

```
data/canonical/      reviewed knowledge, YAML, the only thing that is edited by hand
  entities/          quantities, disequilibria, phenomena, carriers, couplings, transducers, constraints, materials
  claims/            subject —predicate→ object, conditions, energy ledger, relation, evidence, status
  sources/           references; DOIs are verified against Crossref
  pathways/          named, reviewed compositions with measured performance
  searches/          reviewed literature searches (the only records allowed to say "no demonstration found")
  ontology/          units (for dimensional analysis), domains (for coverage), condition tags and conflicts
data/generated/      compiled graph, Crossref verification, automated OpenAlex index queries
packages/schema      zod schemas and the vocabulary
packages/physics     dimensional analysis and the seven route checks
packages/graph       loader with referential validation, compiler, browser-safe query index
pipelines/           validate · build-graph · verify-sources · literature-search · inspect · tests
apps/web             Next.js static site: /, /atlas, /matrix, /path/[id], /phenomenon/[id], /frontier, /coverage, /methods, /api/*.json
worker/              Cloudflare Worker serving the static export
design/              brief, design system, review transcripts, current screenshots
tools/               static server and headless verification
```

## Run it

```bash
pnpm install
pnpm validate            # referential integrity of data/canonical
pnpm build:graph         # data/canonical → apps/web/generated/{graph,paths}.json
pnpm test                # physics and compiler invariants, with negative controls
pnpm dev                 # next dev on http://localhost:3000
pnpm build               # static export to apps/web/out
node tools/verify.mjs    # headless screenshots + overflow/console probes of the export
pnpm deploy              # build, then wrangler deploy from worker/
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

The atlas separates how well a relation's physics is known from whether anyone has looked for a demonstration of a composition. A cell can only say *no direct demonstration found* when a reviewed search record in `data/canonical/searches` says so. Automated OpenAlex queries are stored separately, marked *index queried, not reviewed*, and are never promoted without a person reading the hits. Everything else says *not searched*.

## Status

Version 0.1, first release. The representation has been tested on thermal, mechanical, electromagnetic, chemical and radiative conversions. Nuclear, plasma, quantum-transport and biophysical domains are deliberately thin. See `/coverage` on the site for the numbers and `/methods` for the model.

## Origin

Designed in a conversation that started with "in theory, we should be able to turn anything in the world into energy, correct?" and ended with the plan for this repository; the verbatim thread is in `research/brief/`.
