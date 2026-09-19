# UI review 1 (ChatGPT temporary chat, 19/09/2026 ~11:45 am Sydney)

Inputs: desktop home (thumbnail + full crop), /matrix with drawer, phenomenon page, phone home; the DESIGN.md summary and the banned-defaults list. Verbatim verdict below.

---

VERDICT: PIVOT

The core desktop atlas is very close: the home matrix feels like an instrument/ledger rather than a dashboard, the density is convincing, family rules work, and established/demonstrated/theoretical marks remain distinguishable. The main failures are local rather than conceptual.

The drawer is not production-legible yet. The seven check headings collide (ENERGY FREE, ENERGY, THERMO..., etc.), and the bridge expression is visibly truncated instead of wrapping. The section order itself is correct.

/matrix introduces the strongest banned-default regression: the SHOW controls read as a row of dashboard filter chips/buttons. They compete with the matrix and are visually much heavier than the ledger vocabulary.

The mobile matrix geometry is good: the ~112px row rail and ~32×28px cells preserve the actual matrix. The surrounding responsive shell is not. The navigation/search is simply clipped, and the ledger expands into a large multiline block that consumes too much of the initial viewport.

The phenomenon page is strong. It has the intended paper/reference-sheet hierarchy, restrained measure, serif title, mono metadata and excellent whitespace. The bordered C.01 Thermoelectric element is the one place that starts to resemble a UI tag rather than a ledger reference.

At matrix density, solid square, blue dot and double-square survive well. The 1px not-searched corner is too close to disappearing against #F6F3EC; candidate marks are also visually much louder than not-searched cells, making coverage look more categorical than the legend implies. Addresses are appropriately subdued, with the active coordinate readable.

Fix the drawer check strip first: grid-template-columns: repeat(7, minmax(0, 1fr)); and use font: 500 8px/10px "IBM Plex Mono"; letter-spacing: .02em; overflow-wrap: anywhere;. Give it min-height: 58px; do not allow headings to overlap.

Let bridge paths wrap instead of crop: .bridge-path { white-space: normal; overflow: visible; text-overflow: clip; line-height: 1.45; }. Keep the actual relation string intact, e.g. Pressure gradient → Elastic deformation → Elastic stress → Piezoelectric effect → Separated surface charge → Electric potential difference.

Remove chip styling from SHOW. Use plain inline ledger toggles: border: 0; border-radius: 0; background: transparent; padding: 0 14px 0 0; box-shadow: none;. Separate items with spacing or border-right: 1px solid #D6D0C5, not individual boxes.

On ≤480px, make the header a deliberate horizontal instrument strip instead of clipping: .instrument-header { overflow-x:auto; white-space:nowrap; scrollbar-width:none; }; hide search behind a plain SEARCH text control or move it to a second 32px row. Do not truncate it halfway.

Compress the phone ledger to two lines, not four: .ledger-rail { display:grid; grid-template-columns:repeat(3,max-content); grid-auto-rows:28px; height:56px; overflow:hidden; }. Keep 82 PHENOMENA, 384 CLAIMS, 22 × 31, then 459 PATHS, 62 DEMONSTRATED, 20.8% COVERAGE; move 319 CANDIDATES and 434 UNSEARCHED CELLS into horizontal continuation rather than increasing rail height.

Increase only the not-searched corner's perceptual contrast: keep it 1px, but use #BDB8AE instead of #D7D3CA; do not enlarge it. Keep candidate at the current double-outline size.

Make the phenomenon matrix reference ledger-like rather than tag-like: .phenomenon-address { border:0; border-bottom:1px solid #D6D0C5; padding:3px 0; border-radius:0; } with copy C.01 THERMOELECTRIC.