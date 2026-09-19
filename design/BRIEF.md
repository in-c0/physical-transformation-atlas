# Design brief — Physical Transformation Atlas

Stage 0 of the UI/UX workflow. Derived from the owner's ChatGPT thread
"Matter Into Energy Explained" (17–19 Sep 2026; verbatim copy in
`research/brief/2026-09-19-chatgpt-matter-into-energy-explained.md`). The owner's
instruction to this session was "read all convo … and implement the repo/site", so the
brief below is taken from that thread rather than from a separate interview.

## What it is

A live, public atlas of physical transformations: which disequilibria (temperature
gradient, pressure gradient, chemical potential, …) can drive which physical effects,
through which carriers and coupling mechanisms, into which useful outputs — and, just as
important, which combinations nobody appears to have demonstrated yet.

The canonical object is not an "energy source". It is an evidence-backed claim
(subject, predicate, object, conditions, evidence, status). Claims compose into
conversion pathways. The site is the instrument for inspecting the graph, the matrix of
disequilibria × coupling families, individual pathways, the search frontier, and the
atlas's own coverage.

## Who uses it, where

Physicists, engineers, materials scientists, graduate students and curious technical
readers. Desktop first (a dense research instrument), laptop screens most common; must
remain usable on a phone for reading a single phenomenon or pathway page. Attention level:
focused, reading; nobody is skimming this on a bus.

## The one feeling

**Instrument.** Arriving at the site should feel like arriving at a scientific
instrument with its readouts live, not reading an About page.

## References the thread named

Liked / adjacent: the Materials Project (public computed data + API), OpenAlex (live
scholarly graph), the MIT SciAgents paper (ontology graph + agents), a cartographic
atlas, an IDE, an extremely good research paper.

Rejected explicitly: "glowing sci-fi AI software", gradients, glassmorphism, glowing
nodes, giant pill buttons, a floating AI orb, "Discover the Future of Energy" copy, a
marketing hero, blog/news/pricing sections, a list of energy sources.

## Visual direction fixed by the thread (§11 "Visual language")

- Halfway between a scientific instrument, a very good research paper, a cartographic
  atlas and an IDE.
- Almost-white warm neutral surface (not pure white), near-black text, hairline borders,
  very restrained semantic colours, dense but breathable typography.
- Status colours carry meaning only:
  dark ink = established · blue = demonstrated/measured · violet = theoretical ·
  amber = unresolved · red = contradicted / failed validation · pale grey = unsearched ·
  crosshatch = insufficient evidence.
- The map is the visual spectacle. Everything else stays quiet.
- Numbers on screen always come from the data, never decoration.

## Hard constraints

- Next.js (static export) + Cytoscape.js for the graph; deployed as a Cloudflare Worker
  with static assets and a JSON API under `/api/*`.
- No database at V0: canonical knowledge is source-controlled YAML compiled to a typed
  graph at build time.
- Accessibility: keyboard path through matrix and drawer; `prefers-reduced-motion`
  respected; contrast checked against the actual palette.
- Performance: the atlas pages load one graph JSON (< 400 KB) once; no per-click
  network round trips.
- Language on the site must be scientifically cautious: "no demonstration found in
  indexed evidence as of [date]", never "never explored".

## Signature interaction (from §18)

Click an empty matrix cell. Instead of nothing, a drawer opens: the direct relation
("no canonical relation currently recorded"), the known bridges (multi-hop pathways
between that disequilibrium and that coupling family), and for each pathway how many
constituent relations are established, whether the complete composition was searched, and
whether a direct demonstration was found. An empty square becomes a scientific question.

## What already exists

Nothing. New repository, new site.
