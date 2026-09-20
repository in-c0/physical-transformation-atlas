# Design system — "Calibrated Ledger"

Direction chosen 19/09/2026 from three ChatGPT concepts (`reviews/concept-1.md`), resolved
after Claude's critique (`reviews/concept-2.md`). Everything visual in `apps/web` traces to a
token here. Concept art (Stage 2 renders) was not produced: the direction is typographic and
data-led, and the owner's thread forbids decoration; see `LOG.md` open questions.

## Thesis

The atlas behaves like a continuously updated experimental ledger: every visible thing has a
coordinate, provenance, a state, and a measurable relationship to the underlying dataset.
Sections are separated by rules, not boxes. There is no CTA because the matrix is the CTA.
An empty square has as much intellectual weight as a populated one.

## Tokens (transcribed verbatim from concept-2 §8)

```css
:root {
  --surface: #F6F3EC;  --surface-raised: #FBF9F4;
  --ink: #1B1A18;  --ink-secondary: #5D5A54;  --hairline: #D6D0C5;
  --unsearched: #D7D3CA;  --insufficient: #66635D;

  --status-established: #1B1A18;   --status-demonstrated: #1F5D87;
  --status-theoretical: #6A4A86;   --status-candidate: #1B1A18;
  --status-searched-none: #8A5A16; --status-not-searched: #D7D3CA;
  --status-forbidden: #1B1A18;     --status-contradicted: #9C3B31;
  --status-insufficient: #66635D;

  --check-pass: #1B1A18; --check-fail: #9C3B31; --check-unresolved: #8A5A16; --check-unknown: #5D5A54;

  --font-heading: "Source Serif 4", serif;
  --font-ui: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;

  --text-page-title: 30px; --leading-page-title: 34px;
  --text-section: 20px;    --leading-section: 25px;
  --text-subsection: 15px; --leading-subsection: 20px;
  --text-body: 14px;       --leading-body: 20px;
  --text-ui: 12px;         --leading-ui: 16px;
  --text-data: 11px;       --leading-data: 15px;
  --text-micro: 10px;      --leading-micro: 13px;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600;

  --header-height: 44px; --ledger-height: 56px; --probe-height: 28px; --status-rail-height: 28px;
  --matrix-cell-home-w: 24px; --matrix-cell-home-h: 20px;
  --matrix-cell-w: 40px;      --matrix-cell-h: 32px;
  --matrix-cell-phone-w: 32px; --matrix-cell-phone-h: 28px;
  --matrix-row-axis: 184px; --matrix-row-axis-phone: 112px;
  --matrix-column-axis: 76px; --matrix-column-axis-phone: 48px;
  --drawer-width: 440px;

  --border: 1px solid #D6D0C5; --border-strong: 1px solid #1B1A18; --family-divider-width: 2px;
  --radius-none: 0px; --radius-control: 2px; --radius-panel: 0px;
  --shadow-none: none; /* drawers are separated by a border, never a drop shadow */

  --focus-color: #1B1A18; --focus-width: 2px; --focus-offset: 2px; --focus-separator: #F6F3EC;
  --hatch-angle: 45deg; --hatch-line: 1px; --hatch-period: 5px;

  --duration-probe: 120ms; --duration-reflow: 180ms; --duration-drawer: 220ms; --duration-graph: 280ms;
  --ease-probe: cubic-bezier(0.2, 0, 0, 1);
  --ease-reflow: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-drawer: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-graph: cubic-bezier(0.22, 1, 0.36, 1);
  --z-base: 0; --z-sticky-axis: 10; --z-header: 20; --z-drawer: 30; --z-focus: 40;
}
@media (prefers-reduced-motion: reduce) {
  :root { --duration-probe: 0ms; --duration-reflow: 0ms; --duration-drawer: 0ms; --duration-graph: 0ms; }
}
```

Contrast on `--surface`: ink 15.69:1 · demonstrated 6.37:1 · theoretical 6.45:1 ·
searched-none/unresolved 5.33:1 · contradicted 6.15:1 · insufficient 5.40:1 ·
secondary ink 6.20:1. Unsearched (1.35:1) is a fill only, never text.

## Type

Source Serif 4 (600) for page titles and major sections only. IBM Plex Sans for UI and body.
IBM Plex Mono for identifiers, addresses, readouts, equations and data cells. Do not uppercase
whole headings; uppercase mono is reserved for small structural labels (EVIDENCE, CONDITIONS,
SEARCH STATE). Tabular numerals everywhere numbers align.

## Composition

Home: 44px instrument header → 56px live ledger rail (typographic readouts separated by
vertical hairlines, never KPI cards) → 28px probe readout → the full matrix at 24×20 px cells
with a 184px sticky row axis and a 76px column header (20px family band + 56px labels) →
28px status rail (legend left, `INDEXED THROUGH {date} · DATASET r{hash}` right). No copy above
the matrix. `/atlas` carries the Cytoscape graph. `/matrix` is the same object at 40×32 px.

Row addresses `D.04`, column addresses `C.11`: Plex Mono 10/13 500, letter-spacing 0.02em,
secondary ink, primary ink when active; 42px address field then the name in Plex Sans 11/14 500.
Probe line, Plex Mono 11/15 500:
`PROBE  D.04 × C.11   PRESSURE GRADIENT → PIEZOELECTRIC   SEARCHED · NO DIRECT DEMONSTRATION`.
Addresses are stable dataset addresses; filtering never renumbers. URL keeps `?cell=D.04:C.11`.

Drawer: 440px, enters from the right, contracts the matrix viewport rather than covering it.
One continuous ruled sheet: title (row × col), DIRECT RELATION, KNOWN BRIDGES (numbered), the
seven-check strip, SEARCH RECORD, EVIDENCE. On phone the drawer becomes a full-width sheet in
document flow below the probe.

## Matrix marks (colour = epistemic family, geometry = exact state)

| state | mark (24×20 cell) | colour |
|---|---|---|
| established | ■ 5×5 solid square | ink |
| demonstrated / measured | ● 5px circle | blue |
| theoretical | ◇ 7×7 outline diamond | violet |
| candidate composition | □ 7×7 double-outline square | ink |
| searched, no demonstration found | ○ 7px open circle | amber |
| not searched | no glyph; 1px inset corner └ stroked #BDB8AE (review 1: #D7D3CA vanished on the surface) | pale grey |
| forbidden by known physics | ⊘ 8px circle-bar | ink |
| contradicted / failed validation | ╱ 9px diagonal | red |
| insufficient evidence | 45° hatch, 1px / 5px | #66635D reduced opacity |

On focus the textual status always accompanies the glyph.

## Pathway checksum (seven checks)

Glyphs only: ✓ pass (ink) · × fail (red) · ? unresolved (amber) · — unknown (secondary ink).
No green. On `/path/[id]` the strip sits after the summary and before the first step: 66px,
seven equal columns separated by vertical hairlines; line 1 abbreviated name (10/13 mono),
line 2 the 16px glyph, line 3 one terse fact if one exists. Phone: 7×1 strip, labels
TYPE / ENERGY / FREE / BOUND / DIM / BC / MAG at 9px, 15px glyphs. Selecting a check expands
RESULT · BASIS · AFFECTED STEPS below the strip. Canonical names: Typed chain; Energy-form
continuity; Conservation / free energy; Thermodynamic bound; Dimensional consistency;
Boundary compatibility; Practical magnitude.

## Keyboard

Arrows move one cell; Home/End first/last coupling in the row; Ctrl/⌘+←/→ jump coupling-family
boundaries; Ctrl/⌘+↑/↓ jump disequilibrium-family boundaries; Enter opens the drawer; Escape
closes it and returns focus to the originating cell.

## Focus

2px solid ink, offset 2px, with a 1px surface separator where the object is dark. Matrix cells:
`box-shadow: inset 0 0 0 2px #1B1A18, inset 0 0 0 3px #F6F3EC`; active row and column get 1px
ink guide rules. `:focus:not(:focus-visible)` gets no ring. Never blue. Never animated.

## Motion

Probe 120ms `cubic-bezier(0.2,0,0,1)` · matrix reflow 180ms `cubic-bezier(0.33,1,0.68,1)` ·
drawer 220ms `cubic-bezier(0.22,1,0.36,1)` · graph camera 280ms same. Focus movement, status
changes and numerical readouts: 0ms. Nothing fades on scroll; nodes never breathe, pulse or
glow; numbers never count up. Reduced motion: every duration 0ms, drawer appears in place.

## State language (canonical strings)

- Not searched. / No recorded search for this direct relation.
- No direct demonstration found. / Searched in indexed evidence through {date}.
- Search incomplete · not decided. / A record exists (an automated index run, or a reviewed search left partial or blocked) but no reviewed result decides it.
- No canonical relation currently recorded. / This does not imply the relation is impossible.
- No composed pathway currently recorded. / No qualifying bridge is present in the current claim graph.
- No relations match these filters. / The underlying atlas has not changed.
- Insufficient evidence to assign a stronger status. (then show what exists)
- Loading atlas index… (geometry renders, marks withheld, ledger shows —)
- Atlas data could not be loaded. / The interface is available, but evidence and status data are unavailable. RETRY
- Validation error in atlas data. (dataset revision + error id)

## Phone (≤ 640px)

Header 40px, ledger hidden. `/phenomenon/[id]`: PHENOMENON / id (mono 10/13), name in Source
Serif 26/31 600, definition, one status line, then full-width ruled sections. `/path/[id]`:
pathway first, vertical chain one step per ruled section, checksum compressed. Matrix stays a
matrix: 112px sticky row rail, 32×28 cells, 48px sticky column header, 32px probe.

## Toggles (review 1)

Filter and type toggles (matrix SHOW, atlas toolbar, frontier status) are plain inline ledger toggles:
no border, no radius, transparent, separated by a 1px hairline `border-right`, secondary ink when
inactive with a strike-through, primary ink when active. Never chips.

## Do / don't

Do: rules not boxes; readouts on one baseline; marks not filled cells; textual status on focus;
real counts or an em dash. Don't: cards, pills, gradients, shadows, glow, spinners, shimmer,
KPI tiles, count-up numbers, green for pass, blue for focus, ASCII x for ×.
