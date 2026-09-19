# Design log
Stage: 3 — implementation from DESIGN.md (Stages 0–1 done 19/09/2026; Stage 2 renders not run, see open questions)
Direction: Calibrated Ledger (chosen 19/09/2026, ChatGPT concept A + C's checksum strip + B's addresses)

## Components
| component | build | review # | verdict | notes |
|---|---|---|---|---|
| instrument header + ledger rail | — | — | — | |
| matrix (home 24×20, /matrix 40×32) | — | — | — | marks per DESIGN.md table |
| probe readout | — | — | — | |
| evidence drawer | — | — | — | the one animated component (220ms drawer, 180ms reflow) |
| pathway checksum strip | — | — | — | |
| atlas graph (Cytoscape) | — | — | — | camera 280ms, user-initiated only |
| frontier list + filters | — | — | — | |
| coverage bars | — | — | — | |

## Open questions (ASK OWNER)
- Stage 2 concept art was not generated. The direction is typographic and the owner's thread
  forbids decoration, so renders would mostly re-draw the token sheet. Run it anyway?
- Repository visibility: the thread argues for an open atlas; the repo was created private.

## Session history
- 19 Sep 2026 ~10:20 am — Stage 0: BRIEF.md derived from the owner's ChatGPT thread (no separate interview; owner asked for implementation).
- 19 Sep ~10:35 am — Stage 1: temporary chat, three directions received (reviews/concept-1.md).
- 19 Sep ~10:50 am — Critique sent (home = matrix not graph; two kinds of absence; adopt C's checksum and B's addresses). Resolution received (reviews/concept-2.md), transcribed to DESIGN.md.
