# Pass 14 — the phone (21/09/2026 ~12:15–2:40 am Sydney)

Focus sent: nothing had reviewed the site at phone width. Eight pages at 375 × 812 and 390 × 844,
judged as a physicist on a train: what breaks, what collapses versus what must stay (the cell as a
question, the route's epistemic block, the frontier decision line, the record sentence), exact CSS
and component changes, and where phone copy should be shorter. ChatGPT (High, ~6 min, in a new
regular chat "Phone Layout Review"). Verdict: PIVOT — 9 findings.

Mechanics: the first send was lost — the tab froze before ChatGPT had assigned a persistent
conversation id (`/c/WEB:…`), so the reload found nothing. Rule recorded: confirm the URL carries a
real id before walking away. The re-send succeeded; the tab froze again at the end and was recovered
by killing the renderer and reloading.

## Findings (condensed) and what was done

1. Home matrix: keep it as a two-way scrolling research surface with sticky axes (no row or cell
   picker); the 10–11 px coordinates and 8 px waypoint numerals were the problem. → `touch-action:
   pan-x pan-y`, scroll padding for the sticky axes, 12 px row names / addresses / probe, waypoint
   numerals hidden on phones (the sheet states the same waypoint), cells unchanged at 32 × 28. Ledger
   labels shortened on phones only (MATRIX · DIRECT CELLS · NO SEARCH RECORD · FRONTIER COMPOSITIONS ·
   DEMONSTRATED ROUTES) with the full label kept as the accessible name.
2. The cell sheet: right decision (done before the reply as a fixed bottom sheet), but its rows were
   desktop flex. → `.claimLine` wraps, `.bridgeActions` wraps, `.axisLinks` one column, `.linkBtn`
   24 px, `85dvh` with a safe-area bottom pad, sticky sheet head; QUESTION stays first and never behind
   a disclosure. The /matrix status toolbar is a closed "Show cell states" disclosure on phones; the
   phone intro is the specified sentence with generated numbers ("67 cells carry recorded direct
   relations. 892 of 897 cells have no search record. Tap a cell to ask what the atlas records for
   that pair."); keyboard instructions are desktop-only.
3. Frontier: the largest density problem. → Decision line stacked at 12 px, one fact per line in the
   specified order; the filter form behind a closed "Filters" disclosure on phones with the result
   count outside it; each row's audit fields behind a per-row "Technical record" disclosure (chain,
   status/id, decision line and actions stay visible); 24 px controls; the specified short phone lead;
   the desktop explanation kept behind "How routes are classed and ordered".
4. Route page: structure sound; the 9 px check abbreviations were not. → Strip 56 px with 12 px
   abbreviations; `.facts dt`, `.coord`, `.stepRecord` 12 px with 24 px targets; the epistemic block
   stays above the steps.
5–6. Entity and claim records: keep the record sentence where it is. → `.record` 14 px, `.meta` 12 px,
   `.cellLink` 12 px wrapping with a 24 px target, `.explore` links 24 px; linked heading tokens get
   `overflow-wrap: anywhere` so a long identifier cannot widen the page.
7. Coverage: nine columns cannot be read by scrolling. → On phones the table is replaced by one
   definition-list record per domain (same data, same order, hairline-separated) with the specified
   short lead; the table stays above 640 px.
8. Graph: not a touch instrument. → Show/Layout/legend behind a "Graph controls" disclosure on
   phones with the node navigator and canvas directly available; `touch-action: none` on the canvas so
   one finger pans, pinch zooms, tap selects; on coarse pointers a background tap resolves the nearest
   visible node within 18 rendered px before deselecting; 12 px node labels on phones with the zoom
   threshold kept; edges stay tappable only for fine pointers — node → drawer → "open claim" is the
   supported phone route to a claim.
9. Header: stays sticky at 40 + 32 px; nav and search text raised to 12 px; the nav is kept to one
   scrolling row beside the brand.

A hook (`useWide`) decides whether phone-only disclosures start closed; before hydration everything
is open, so the static HTML and desktop are unchanged. One regression caught by the axe gate on the
way: the hook was placed after an early return in the frontier list (React #310) — moved.

Result: axe clean on 16 pages at both widths, no horizontal overflow, keyboard model intact,
43/43 tests, live.
