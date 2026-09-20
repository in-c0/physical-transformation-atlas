# Pass 6 — accessibility and keyboard audit (20/09/2026 ~11:20 am Sydney)

Focus sent: audit the live site as a keyboard-only user and as a screen-reader user (matrix grid,
drawers, search, frontier filters, atlas graph), plus contrast of the six status colours and the
status marks; report only what a WCAG 2.1 AA reviewer would fail, with concrete changes. ChatGPT (High,
~6 min). Verdict: PIVOT — 30 findings, 17 concrete changes.

## Findings (condensed)

- Home/End moved between family boundaries; the grid convention is row start/end and Ctrl+Home/End for the
  grid corners. Keep Ctrl+Arrow for family jumps.
- The probe was `aria-live`: every focus move was announced twice (cell label + probe). Announce only the
  opening of a cell. Gridcells need `aria-expanded`/`aria-controls` pointing at the drawer; column headers
  need an accessible name that is not the truncated address.
- Drawer had no heading structure: title should be an `h2` the aside is labelled by, section titles `h3`;
  close button said "evidence drawer" for every drawer.
- Phone: the drawer was ordered before the matrix (`order: -1`), so a screen-reader user on phone hit the
  answer before the question.
- `search-incomplete` and `not-searched` marks differed only by weight; the not-searched stroke (#bdb8ae)
  was 1.78:1. Give search-incomplete its own geometry and lift the mark to ≥3:1.
- Hatch and insufficient marks used opacity; the token already carries the tone.
- Form controls used the document hairline (#d6d0c5, 1.6:1) as their border; controls need ≥3:1.
- Chips and link-buttons were 22 px tall; 24 px minimum target.
- Frontier count should be a polite status; check glyphs needed `role="img"` names; the Effects range was a
  label wrapping two inputs.
- Checksum disclosures had no `aria-controls`/region; drawer disclosures the same; clipboard result was
  visual only.
- Atlas graph: the canvas is a raster with no DOM route — no way to select a node from the keyboard, no
  "open claim" from an entity, edge families distinguished by colour only, `reset view` ignored
  reduced-motion.
- No skip link; search input lacked combobox semantics.
- No automated regression: the audit would be repeated by hand next time.

## Applied (commit in README row)

1. Matrix keys: Home → row start, End → row end, Ctrl/⌘+Home → D.01×C.01, Ctrl/⌘+End → last×last.
   `tools/keyboard-probe.mjs` asserts all four plus the family jump.
2. Probe is no longer live; a visually-hidden `role="status"` announces "Cell D.nn × C.nn opened".
   Gridcells carry `aria-expanded` and `aria-controls="cell-drawer"` when selected; column and row headers
   carry `aria-label` (address, name, family).
3. Drawer: optional `id`, `h2` title with `aria-labelledby`, `h3` section titles, close label derived
   from the drawer label ("Close cell drawer", "Close claim drawer"…).
4. Phone drawer order restored to document order.
5. StatusMark: search-incomplete = corner + dot; `--status-not-searched-mark: #8f8a81` (3.1:1); insufficient
   hatch at full token opacity. `.hatch` opacity removed.
6. `--control-border: #8f8a81` on search, frontier inputs/selects, navigator input.
7. 24 px minimum on `.filter`, `.chip`, `.linkBtn:is(button)`.
8. Frontier: count is `role="status" aria-live="polite" aria-atomic`; check glyph wrappers are
   `role="img"` with "label: result. detail"; Effects is a fieldset/legend.
9. Checksum: `useId` `aria-controls` + `role="region"` detail. CellDrawer: materials and search panels have
   ids and `aria-controls`; clipboard result mirrored into a visually-hidden status.
10. Atlas: DOM `GraphNavigator` (filter input + node list, same `setSel` as tapping), "open claim" beside
    "focus" in the entity drawer, canvas `aria-hidden`, selection announced by status. Edge line pattern
    by evidence family (solid / long dash / dash / short dash / dotted) with the legend updated.
    `graphDuration()` honours reduced-motion everywhere, including reset view.
11. Skip link + `#main-content` in the layout; `.srOnly` utility.
12. Search: `role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant`, option ids.
13. `tools/verify.mjs` now injects axe-core (WCAG 2.x A/AA tags) on every page at desktop width; serious
    and critical violations fail the run. First run caught a real defect the audit had missed: the matrix
    corner `columnheader` sat directly under the grid (aria-required-parent) — the header row is now one
    `role="row"` with `display: contents`, bands `aria-hidden`, column-heads container presentational.
    Result: no A/AA violations on any of the 12 probed pages, local and live.

Not applied: the request to add a table-mode alternative for the matrix (a 23×39 table is not more usable
than the grid with the navigator and the announcements; revisit if a screen-reader user asks).
