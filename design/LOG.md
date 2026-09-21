# Design log
Stage: 7 — awaiting owner review (review 2 PASS 19/09 ~11:55 am). Stage 2 renders not run (open question).
Loop 3 (owner 20/09: at least 50 ChatGPT passes): passes 1–15 applied and deployed; pass table in reviews/loop-3/README.md; pass 16 (frontier candidates audited as physics) in flight. Helper source: tools/chatgpt-helpers.js.
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
- 19 Sep ~10:30 am — Stage 1: temporary chat, three directions (reviews/concept-1.md).
- 19 Sep ~10:45 am — Critique + resolution (reviews/concept-2.md) → DESIGN.md.
- 19 Sep ~10:55–11:30 am — Stage 3 build; headless verification at 1440 and 375 (tools/verify.mjs → design/current/).
- 19 Sep ~11:35 am — first deploy to https://physical-transformation-atlas.wldud5192.workers.dev.
- 19 Sep ~11:45 am — Review 1 (temporary chat, 5 images): VERDICT PIVOT, 8 concrete changes (reviews/ui-review-1.md). All applied; rebuilt; redeployed.
- 19 Sep ~11:50 am — Review 2 sent with the rebuilt matrix/drawer and phone home.
- 19 Sep ~11:55 am — Review 2: VERDICT PASS (reviews/ui-review-2.md). Stage 6 checklist run; stage 7 awaits the owner.
- Loop-3 mechanics (19/09 pm): ChatGPT with High reasoning browses the public site and repo itself, so text passes need no screenshots. In a background Chrome tab the reply text never renders (visibilityState hidden); read it from React state via the message element's `__reactFiber$` → `memoizedProps.message.content.parts`. Never replace `main.innerHTML` to dump text — it detaches React and the next submit becomes a native GET that destroys the temporary chat; append a `<pre>` to `body`, hide `main`, `get_page_text`, restore. Send with `execCommand("insertText")` + a synthetic Enter `keydown` on `#prompt-textarea`; do not click the submit button by ref. The clipboard is shared with other sessions on the machine — do not use it as a transport.
- Mechanics: `upload_image` uploads the *scaled* capture, so take review screenshots at scale 1; the image tab froze once on `captureScreenshot` — retry once; serve screenshots through a small viewer page (tools/serve-dir.mjs + a fit-to-viewport HTML) rather than opening the PNG directly.
- 20 Sep ~12:05 pm — Chrome: chatgpt.com tabs froze in the renderer (readyState stuck at `interactive`, every CDP evaluate timing out, composer never mounted) for three fresh tabs in a row; closing the group and creating a new one on a fourth attempt loaded cleanly. When a chatgpt tab hangs, close the whole group rather than retrying in it — all chatgpt tabs share one renderer.
- 20 Sep ~1:05 pm — Chrome froze the temporary-chat tab again at the end of the pass-8 reply (renderer at 0 % CPU, every CDP call timing out, page never reaching document_idle). Diagnosis: the tab is a background tab of the owner's Chrome window; Chrome freezes CPU-heavy hidden tabs after ~5 min and only a tab activation unfreezes it, which no tool here can do. A temporary chat cannot be reloaded, so that reply was lost. From pass 8 the loop runs in ONE regular chat per rotation (title "PTA loop 3 — pass 8", https://chatgpt.com/c/59fe29f2-9636-4f7b-86a1-bac62cfa2c60) so a frozen tab can be closed and the conversation reloaded, and the helper injection now holds a Web Lock (`navigator.locks.request('pta-keepalive', …)`), one of Chrome's freezing opt-outs. The owner can delete the regular chats when the loop ends.
- 20 Sep ~11:30 pm — Loop-3 chats: passes 8–13 in https://chatgpt.com/c/6aaf4b16-65c0-83ec-a175-88ed57bdca1f ("Dataset Export Review"); pass 14 onward in https://chatgpt.com/c/6aaf89db-2f20-83ec-8584-569c8065f001 ("Review phone layout"). A first attempt at pass 14 was lost: the tab froze before ChatGPT had assigned a persistent conversation id (the URL still read `/c/WEB:…`), so the reload found nothing. Rule: after sending, confirm the URL has a real id before walking away; if it is still `WEB:` the message is not yet safe.
- 20 Sep ~7:35 pm — a pass-16 send silently dropped: `__pta_send` is async and was called without `await`, and the tab's DOM was in the post-generation truncated state (the last assistant turn rendered as three characters). Rule: reload the conversation URL, re-inject tools/chatgpt-helpers.js, confirm all turns render, then `await window.__pta_send(...)`. The CDP evaluate then times out because the send starts generation (renderer at 50–100 % main thread); that is the normal signal to switch to the renderer-CPU idle monitor.
- 20 Sep ~11:20 pm — Loop-3 chat rotated for pass 18 (screening the frozen route-search lists): new regular chat https://chatgpt.com/c/6aafbaec-67e0-83ec-8ada-12862652e066 (passes 14–17 lived in https://chatgpt.com/c/6aaf89db-2f20-83ec-8584-569c8065f001). The owner can delete both when the loop ends.
- 21 Sep ~8:55 pm — Loop-3 chat rotated for pass 44: new regular chat https://chatgpt.com/c/6ab10cd2-b9ec-83ec-9d17-df9b724c1153 (passes 18–43 lived in https://chatgpt.com/c/6aafbaec-67e0-83ec-8ada-12862652e066, 1049 nodes). Reason: after the pass-43 reply was read from client state, a reload showed "Thinking" with a stop button indefinitely; the server-side mapping (GET /backend-api/conversation/<id> with the session token) held no assistant text after the pass-41 reply — the pass-42 and pass-43 replies had streamed to the client (read via the fiber helpers, saved to the pass logs) but were never persisted, and the current node was a mid-turn progress note with end_turn false. Rule: when a reload shows a stop button with no stream, check the server mapping; if the last replies are missing, rotate — do not send into a conversation whose server state lags what you read. The new chat's opening message carries the ground rules and a "where we are" summary; the model is gpt-5-6-thinking with the account's High thinking effort (the composer shows "High").
