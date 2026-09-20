# Pass 1 — use the instrument as a working physicist (19/09/2026 ~10:35 pm Sydney)

Focus sent: browse home, /matrix?cell=D.02:C.10, /path/d4b83f7f17, /path/87c18f5e4c, /frontier,
/phenomenon/seebeck-effect, /methods; report (a) where the instrument failed, (b) the five most valuable
scientific-usefulness improvements, (c) over/under-claims. ChatGPT browsed the live site and the public
repo (7 min). First reply rendered as "VER" + citation chips because the tab was hidden; the text was read
from React state instead. Verbatim:

---

VERDICT: PIVOT

1. The evidence model is stronger than the instrument currently exposes. I approached D.02 × C.10 as a working question: does this disequilibrium directly access this coupling; if not, what composed route exists; has that exact composition been searched; and what evidence supports each step? The matrix led me to a composed route, but the path presentation can simultaneously say "complete composition: not searched" and "direct demonstration found: none." Those are not epistemically compatible. If the composition has not been searched, the site cannot report that no demonstration was found.

2. The candidate path 87c18f5e4c exposes a deeper frontier-classification problem. Bulk fluid flow → Ocean wave motion → Mechanical motion → Mechanical work. The atlas already contains a named Wave energy converter pathway that overlaps the first two relations. So this route should not be presented simply as an isolated frontier candidate. The instrument should surface that it substantially overlaps an already recorded real pathway. Otherwise "not searched as an exact graph sequence" starts to look like "scientifically unknown."

3. Evidence provenance changes meaning between matrix, path, and frontier. In the cell drawer, the Evidence section is derived from direct claims; with an active composed bridge the evidence section does not represent that bridge. On Frontier, "N supporting" counts sources attached to constituent claims, not papers demonstrating the complete composition.

4. The thermoelectric generator path's quantitative record is not yet usable for serious comparison: module or material efficiency; hot- and cold-side temperatures; material system; geometry; matched-load condition; heat-flow denominator; which source supports each number?

5. Constituent maturity and composition maturity are conflated: a generated path labelled "K4 · experimentally observed" while the composition is "not searched" overclaims the status of the composition.

6. The Seebeck mechanism wording is too categorical (carriers move hot→cold and accumulate at the cold end, alongside ΔV = S·ΔT). Polarity depends on carrier type, transport coefficients and sign conventions.

7. Site-level phrases overclaim scope: "the known and unexplored transformation space"; "Known physics, unusual compositions" (the compiler enumerates compositions, not novelty).

8. Underclaim: the atlas knows relevant context (the Wave energy converter) and does not surface it beside the candidate.

Concrete changes (priority order): (1) four-state search language — demonstrated / no direct demonstration found in the recorded search through {date} / not reviewed — index query only / not assessed — complete composition not searched; never "none" for not-searched; (2) split constituent vs composition evidence (`constituent_source_ids`, `composition_source_ids`; drawer evidence follows the active bridge; frontier "N constituent sources"); (3) known-pathway overlap (`known_pathway_overlap: {pathway, relation: exact|prefix|subsequence, shared_claims, route_claims}`; frontier subtitle → "Compositions assembled from recorded physical relations"; no "unusual/novel/unexplored"); (4) `constituent_floor` vs `composition_status`, rendered "Constituent evidence floor · K4" and "Composition · not searched"; (5) performance as records {value, unit, scope, conditions, source_ids}, theoretical relation separated from measured performance; (6) Seebeck copy: "At open circuit, temperature-driven carrier transport is balanced by an electric field, producing a measurable thermoelectric voltage. Its polarity depends on the transport coefficients, dominant carriers, and the stated sign convention." plus explicit sign-convention metadata; (7) home scope line → "recorded and not-yet-searched regions of the current atlas"; (8) negative-result provenance visible in context (date, engine, query, review status, works, human-reviewed); (9) route-level relation summary before the checks.
