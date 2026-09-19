# Design log
Stage: 7 — awaiting owner review (review 2 PASS 19/09 ~2:50 pm). Stage 2 renders not run (open question).
Direction: Calibrated Ledger (chosen 19/09/2026, ChatGPT concept A + C's checksum strip + B's addresses)

## Components
| component | build | review # | verdict | notes |
|---|---|---|---|---|
| instrument header + ledger rail | v2 (4708c15) | 1, 2 | PIVOT → applied → PASS | phone: scrolling nav strip, search on its own 32px row; ledger two 28px rows in column flow |
| matrix (home fills width 24×20→40×32, /matrix 40×32) | v2 | 1, 2 | PIVOT → applied → PASS | not-searched corner stroke #BDB8AE (mark only); SHOW toggles are plain ledger toggles, no chips |
| probe readout | v1 | 1 | PASS (no finding) | |
| evidence drawer | v2 | 1, 2 | PIVOT → applied → PASS | compact check strip repeat(7,minmax(0,1fr)), 500 8px/10px mono, min-height 58px; bridge chains wrap |
| pathway checksum strip (/path) | v1 | 1 | not reviewed | desktop 66px strip; phone 7×1 |
| atlas graph (Cytoscape) | v1 | — | not reviewed | camera 280ms user-initiated only; labels staged by zoom; toolbar toggles match the ledger vocabulary |
| frontier list + filters | v1 | — | not reviewed | status toggles match the ledger vocabulary |
| coverage bars | v1 | — | not reviewed | |
| phenomenon page | v2 | 1 | PASS with one change → applied | matrix reference is border-bottom only, uppercase |

## Open questions (ASK OWNER)
- Stage 2 concept art was not generated (exception `2026-09-19-atlas-design-stage-2-8836`).
- Repository visibility (exception `2026-09-19-atlas-repo-visibility-3650`).

## Session history
- 19 Sep 2026 ~10:20 am — Stage 0: BRIEF.md derived from the owner's ChatGPT thread (owner asked for implementation).
- 19 Sep ~10:35 am — Stage 1: temporary chat, three directions (reviews/concept-1.md).
- 19 Sep ~10:50 am — Critique + resolution (reviews/concept-2.md) → DESIGN.md.
- 19 Sep ~11:00 am–1:50 pm — Stage 3 build; headless verification at 1440 and 375 (tools/verify.mjs → design/current/).
- 19 Sep ~1:55 pm — first deploy to https://physical-transformation-atlas.wldud5192.workers.dev.
- 19 Sep ~2:20 pm — Review 1 (temporary chat, 5 images): VERDICT PIVOT, 8 concrete changes (reviews/ui-review-1.md). All applied; rebuilt; redeployed.
- 19 Sep ~2:45 pm — Review 2 sent with the rebuilt matrix/drawer and phone home.
- 19 Sep ~2:50 pm — Review 2: VERDICT PASS (reviews/ui-review-2.md). Stage 6 checklist run; stage 7 awaits the owner.
- Mechanics: `upload_image` uploads the *scaled* capture, so take review screenshots at scale 1; the image tab froze once on `captureScreenshot` — retry once; serve screenshots through a small viewer page (tools/serve-dir.mjs + a fit-to-viewport HTML) rather than opening the PNG directly.
