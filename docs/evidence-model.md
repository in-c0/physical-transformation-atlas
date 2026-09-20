# Evidence model

A claim carries `evidence: [source ids]` and a `status`. Statuses, strongest first:
`established`, `replicated`, `demonstrated`, `reported`, `theoretically-predicted`, `hypothesised`, `disputed`, `contradicted`, `invalid`.

Rules the validator enforces:

- every claim except a `hypothesised` one cites at least one source;
- every cited source exists in `data/canonical/sources`;
- a source is a paper, review, book, database, standard, patent, thesis, report or web page, with authors, year and venue where known.

Rules the pipeline enforces:

- `verify-sources` asks Crossref for every DOI and records whether the returned title matches the one on file (token overlap ≥ 0.5). The result is shown beside each reference on the site as `crossref ✓ <date>` or `crossref: not matched`. A mismatch means the DOI is wrong, not that the paper is; fix the DOI.

## Evidence thresholds

The canonical wording of each status is in [vocabulary.md](vocabulary.md); the testable minimums are these:

- `established` — textbook physics; at least two independent first-author groups, or a review or book, among the sources (enforced by a test).
- `replicated` — at least two independent first-author groups are recorded (enforced by a test).
- `demonstrated` — at least one credible physical experiment or device.
- `reported` — one paper reports it, with no independent confirmation recorded.
- `theoretically-predicted` — derived or predicted, not experimentally observed in the atlas record.
- `hypothesised` — proposed without a supporting calculation; a source is optional (the only status that may cite none).
- `disputed` — credible recorded sources disagree.
- `contradicted` — a credible recorded source contradicts the claim.
- `invalid` — withdrawn or shown wrong.

Rules of thumb for authors:

- Prefer the original report plus one review or textbook, so a reader can find both the discovery and the modern treatment.
- Contradictory evidence goes on the claim as a second source with `status: disputed` or `contradicted`, and the notes explain the disagreement. The site counts contradictory claims on each route.

Route-level evidence is kept apart from constituent evidence. A compiled route carries `constituent_source_ids` (sources cited by its steps) and `composition_source_ids` (sources cited by a recorded pathway for the whole route, including its datum-level measurements). The site never presents the first as evidence for the composition.

Pathway performance is recorded datum by datum where it can be: `performance.measurements[]` entries carry the quantity, the value as written in the source, the scope (material / device / module / system / plant / laboratory / field / model), the regime, the sources and the year. Summary fields (`efficiency_typical`, `efficiency_record`, `power_density`) remain as reviewed summaries and are labelled as such on the site.

The evidence rule is enforced by a test: a `replicated` claim needs sources from two independent first authors; an `established` claim needs two independent groups or a review or book among its sources.

Search records (`data/canonical/searches`) are separate from evidence. They record what was looked for, where, when, by whom, and whether a qualifying demonstration was found. They are the only records that can produce "no demonstration found".
