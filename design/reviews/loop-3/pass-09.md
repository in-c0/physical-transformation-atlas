# Pass 9 — arrival pages and search (20/09/2026 ~1:50–2:30 pm Sydney)

Focus sent: a physicist lands from a search engine on one entity, claim, source or route page with
no context. Ten live pages named. Judge first-screen order (what · how sure · what next), whether the
title and readouts stand alone, section order and padding, internal linking and dead ends, six
search terms against what a physicist expects, and copy that reports nature instead of the atlas.
ChatGPT (High, ~5 min). Verdict: PIVOT — 10 findings.

## Findings (condensed) and what was done

1. Entity header went title → metadata → five counts with no statement of how sure the atlas is and
   no next step. → One generated sentence after the summary ("Atlas record: 4 claims reference this
   phenomenon — 4 established."), an Explore line of section anchors, readouts renamed (enumerated
   routes · routes with complete-composition evidence · candidate routes not searched · cited
   sources), sections reordered Relations → Matrix context → Routes → Sources → Cite.
2. Raw condition-tag ids on the first screen; D.xx/C.xx with no legend; the salinity-gradient summary
   stated a fact of nature. → Tags carry a `label` in `ontology/conditions.yaml`, travel in the compiled
   graph (`graph.ontology.condition_tags`) and render as "solid · conductor required · temperature
   gradient required" with the id in the tooltip; a legend line under every matrix-context block;
   the salinity summary now says what the atlas records.
3. A phenomenon page reached its family but not its cells. → Every (canonical driver × member
   family) cell is listed with its status, from drives and member_of claims only.
4. Claim pages had no prose statement, a "reviewed" label with no date, and named pathways repeated
   in the route list. → `claimSentence()` generates "The atlas records this claim as established: a
   temperature gradient drives the Seebeck effect under the conditions below." with proper-noun,
   article and plural-verb handling (proper nouns detected from the atlas's own text); "record
   reviewed {date}" or "no record-level review date"; one Uses section (recorded pathways, then only
   the routes they do not already represent); order Statement → Conditions → Relation → Evidence →
   Matrix context → Uses → Notes → Cite.
5. Non-drives claims (dufour-onsager) were matrix dead ends. → A "Related matrix context" block for
   claims about a phenomenon: its families and driver cells, labelled as context the claim does not
   itself create.
6. Source pages read as bibliography with unexplained "crossref ✓". → "Atlas use: this paper is
   cited as evidence by 1 claim and 0 named pathways. Bibliographic record verified against Crossref
   on …"; an Atlas context block derived from the citing claims (families, cells, routes); order
   Record → Use → Context → Claims → Pathways → Cite.
7. Unnamed route pages repeated the chain as H1; "constituent evidence floor" misnamed a maturity
   scale. → H1 is source → sink for unnamed routes with the chain beneath; labels now "constituent
   maturity floor", "composition maturity", "search for this exact route"; an Explore line.
8. Coordinates sat after the steps; steps did not link the claim record; no route cite block. →
   "Matrix context" moved directly after the epistemic block with a cell link and a family link per
   coordinate; "claim record" on every step; resolved condition tags on steps; CiteBlock on routes.
9. CiteBlock and CITATION.cff said `meta.revision`; the entity kind fell through to a route URL. →
   `meta.data_hash` everywhere, "Dataset revision r{hash} (hash of the canonical data)", entity kind
   requires an explicit href.
10. Search: OR-like ranking let partial matches interleave with full ones; no pathways; "osmotic
    power" missed the salinity gradient; no-result copy. → Full-token matches always precede partial
    ones; named pathways are indexed (waste heat → Thermoelectric generator); an exactly named
    coupling lifts its member phenomena and their drivers; aliases "osmotic power" / "salinity-gradient
    power" on the salinity gradient, PRO and RED; whole-symbol queries (ΔT, ∇T); name-prefix matches
    outrank alias matches (Seebeck → Seebeck effect, not the Thermoelectric family); new no-result
    sentence; five ranking tests.

Found while working, not in the review: `carrier:fluid-flow` had no consumer, so the Marangoni effect,
thermo-osmosis and thermomagnetic convection were on no route at all. Three carrier-level claims
(fluid flow drives lift, flow-induced vibration and the streaming potential, same sources as the
disequilibrium-level claims) connect them: 589 → 681 routes, 606 → 574 unsearched cells, and the
Marangoni page now shows 36 routes including thermocapillary-flow compositions that are real open
questions.

Result: revision rf361cf560636 (447 claims · 681 routes) · 28/28 tests · axe clean on 15 pages · exports valid
against the schema, live.
