# Concept review 2 — critique and resolution (same temporary chat, 19/09/2026 ~10:55 am Sydney)

Claude's pushback: (1) home first viewport = ledger rail + compact matrix, graph on /atlas; (2) distinct marks for not-searched vs searched-no-demonstration vs candidate, forbidden vs contradicted; (3) adopt C's pathway checksum strip for the seven computed checks; (4) adopt B's row/column addresses for the probe readout. Plus phone compositions, state language, focus ring, final token list. Verbatim reply below; transcribed into DESIGN.md.

---

The four pushbacks improve the direction. The main correction is conceptual: the home should visualize the research space, while /atlas visualizes the research graph. Those are different jobs. A force-directed graph privileges recorded objects and relationships; the matrix uniquely makes recorded knowledge and structured absence coexist in the same visual field.

1. Home — matrix first

I would not argue for the graph anymore. The home should begin with the 44px instrument header, then a 56px ledger rail, then the matrix consuming everything down to a 28px status/interaction rail at the viewport bottom. There is no introductory copy above it. At 1440px wide, reserve 184px for the sticky disequilibrium axis and the remainder for 24×20px cells. The column-header zone is 76px: 20px for coupling-family bands and 56px for individual coupling labels. The home matrix is deliberately more compressed than /matrix; individual cell marks remain legible, while full names resolve through the probe readout rather than trying to print every label comfortably. The upper-left matrix corner reads DRIVER ↓ / COUPLING → in IBM Plex Mono 10/13 500. Hover/focus/keyboard movement updates a persistent 28px probe line immediately above the matrix: D.04 PRESSURE GRADIENT × C.11 PIEZOELECTRIC · SEARCHED / NO DIRECT DEMONSTRATION. Clicking opens the right drawer and reduces only the matrix viewport width; it does not overlay the selected cells on desktop. The bottom rail contains the status legend on the left and dataset stamp on the right: INDEXED THROUGH 2026-09-19 · DATASET r…. /atlas then gets the free-form Cytoscape graph as its primary object, where topology rather than absence is actually the question.

The useful home hierarchy is therefore:

44px   instrument navigation
56px   live ledger / corpus counts
28px   current probe readout
────
       coupling-family header
       coupling labels
       ┌──────────────────────────────────────────────┐
       │                                              │
       │          THE TRANSFORMATION MATRIX           │
       │       known and unexplored in one field      │
       │                                              │
       └──────────────────────────────────────────────┘
28px   legend · search coverage · dataset revision

That also resolves a weakness in my original A: putting the graph first would have made the homepage look information-rich while actually hiding the Atlas's most original epistemic object—the explicitly classified blank.

2. Matrix status model — distinguish kinds of absence

I would keep colour and geometry orthogonal: colour communicates broad epistemic family; mark geometry communicates the exact state. That prevents us from needing nine unrelated colours.

Matrix state	Mark at 24×20	Colour	Meaning
Established	■ 5×5 solid square	ink #1B1A18	Canonically established physical relation
Demonstrated / measured	● 5px solid circle	blue #1F5D87	Direct experimental/observational demonstration indexed
Theoretical	◇ 7×7 outline diamond	violet #6A4A86	Relation supported theoretically, lacking indexed direct demonstration
Candidate composition	□ 7×7 double-outline square	ink #1B1A18	Complete composed route exists; every constituent relation established; complete composition itself not demonstrated
Searched / no demonstration found	○ 7px open circle	amber #8A5A16	Search was performed as of the displayed date; no qualifying direct demonstration found in indexed evidence
Not searched	no central glyph; #D7D3CA 1px inset corner └	pale grey #D7D3CA	Search state genuinely absent; do not imply negative evidence
Forbidden by known physics	⊘ / circle-bar construction, 8px	ink #1B1A18	Violates a known physical constraint under the stated conditions
Contradicted / failed validation	╱ 9px diagonal stroke	red #9C3B31	A proposed relation made a falsifiable claim and indexed evidence contradicts/fails it
Insufficient evidence	45° hatch, 1px / 5px spacing	#66635D at reduced opacity over surface	Evidence exists but cannot support assignment to a stronger state

Two details matter. Candidate is not theoretical: its individual physics is already established; what is absent is the demonstrated composition. And forbidden is not contradicted: forbidden says the model/constraints exclude it, while contradicted says somebody made an empirical or formal claim that failed. A forbidden cell therefore stays ink, not red. “Searched / none found” carries the amber unresolved family because it is a result about the search corpus, not evidence that the transformation cannot exist.

On focus, textual status always accompanies the glyph, so the interface never depends on shape or colour alone.

3. Seven-check pathway checksum

Use only four validation glyphs, and deliberately do not introduce green. A pass is ordinary scientific validity, not a celebratory state.

Check result	Glyph	Colour	Contrast on #F6F3EC
Pass	✓	ink #1B1A18	15.69:1
Fail	×	red #9C3B31	6.15:1
Unresolved	?	amber #8A5A16	5.33:1
Unknown / not evaluable	—	secondary ink #5D5A54	6.20:1

On /path/[id], the checksum belongs immediately after the pathway identity/summary and before the first expanded transformation step. It is not buried beside references because it describes the validity of the whole composition. Desktop height is 66px: seven equal columns separated only by vertical hairlines, no cards. First line is the abbreviated check name at 10/13 mono; second line is the 16px glyph; third line may contain one terse quantitative fact if one exists, such as η ≤ 0.31 or J·s⁻¹, but never invented confidence percentages.

TYPED       ENERGY       FREE ENERGY    THERMO BOUND   DIMENSIONAL   BOUNDARY      MAGNITUDE
  ✓            ✓             ✓              ?              ✓            ×              —
 chain       continuous     ΔG < 0           —            valid      mismatch       not known

The canonical names exposed on focus/expansion are Typed chain; Energy-form continuity; Conservation / free energy; Thermodynamic bound; Dimensional consistency; Boundary compatibility; Practical magnitude.

In the matrix evidence drawer, the same strip sits after the selected direct-relation summary / candidate route summary and before evidence citations. At 440px, it becomes seven ~56px columns in a horizontally complete strip—no scroll necessary. Only the abbreviated names appear. Selecting any check expands one ruled subsection directly below it containing RESULT, BASIS, AFFECTED STEPS, and supporting claim IDs. A failed dimensional check, for example, highlights precisely the pathway edge on which units cease to reconcile.

4. D.04 × C.11 addresses

The address is machine-like metadata, not a title. Use IBM Plex Mono 10px/13px, weight 500, letter-spacing: 0.02em, tabular numerals, in secondary ink by default. Row labels have a 42px fixed address field—D.04—followed by the disequilibrium name in IBM Plex Sans 11px/14px 500. On /matrix, the sticky row rail is 184px. Column addresses appear horizontally in their 24px or 40px column headers as C.11; the full coupling name appears in the taller header band and the probe, rather than rotating long text into an illegible forest. The active coordinates switch from secondary ink to primary ink. The probe readout uses IBM Plex Mono 11px/15px 500:

PROBE  D.04 × C.11   PRESSURE GRADIENT → PIEZOELECTRIC   SEARCHED · NO DIRECT DEMONSTRATION

Use the multiplication sign ×, never ASCII x. The addresses are stable dataset addresses, so filtering must not renumber them. Arrow keys move one physical cell; Home/End move to the first/last visible coupling in that row; Ctrl/⌘ + ←/→ jumps coupling-family boundaries; Ctrl/⌘ + ↑/↓ jumps disequilibrium-family boundaries; Enter opens the evidence drawer; Escape closes it and restores focus to the originating cell. The URL can preserve the probe as ?cell=D.04:C.11, making any scientific question directly linkable.

5. Phone composition

For /phenomenon/[id], preserve the paper-like reading hierarchy rather than reproducing the desktop instrument layout. At ≤640px, the global header contracts to 40px; corpus readouts disappear from the page chrome. The page begins with PHENOMENON / P-… in mono 10/13, the phenomenon name in Source Serif 4 26/31 600, its canonical one-line definition, then one inline status/evidence line. Conditions, relations, evidence and references follow as full-width ruled sections—no cards and no desktop drawer. Evidence entries become normal stacked bibliographic records.

For /path/[id], retain the actual pathway as the first scientific object. The title is followed by a vertical chain, one transformation step per ruled section. The seven-check checksum remains directly below the summary but compresses to a 7 × 1 strip: seven equal-width cells, abbreviated labels TYPE / ENERGY / FREE / BOUND / DIM / BC / MAG, 9px labels and 15px glyphs. Tapping a check expands its rationale beneath the strip. Desktop side annotations move inline immediately after the step they annotate; nothing essential disappears.

The matrix does not transform into a list on phone—that would destroy the object's identity. It becomes a horizontally and vertically scrollable probe viewport with a 112px sticky row rail, 32×28px cells rather than the desktop's compact 24×20, a 48px sticky column header, and a persistent 32px probe readout above it. The page initially positions at the first meaningful data region but never auto-pans afterward. Selecting a cell opens its evidence as a full-width sheet in normal document flow below the probe, not a drawer covering the matrix; the selected cell remains visible at the top edge when practical. Filters and legend become two compact disclosure rows above the matrix. The matrix, coordinates, status glyphs, probe semantics and keyboard/accessibility model all remain intact.

6. Empty, loading and error language

The language should report the state of the Atlas, never pretend to report the state of nature. These are the canonical strings:

State	Primary language	Secondary language
Never searched	Not searched.	No recorded search for this direct relation.
Search completed, none found	No direct demonstration found.	Searched in indexed evidence through {date}.
No canonical relation	No canonical relation currently recorded.	This does not imply the relation is impossible.
No bridges	No composed pathway currently recorded.	No qualifying bridge is present in the current claim graph.
Filter returns zero	No relations match these filters.	The underlying atlas has not changed.
Evidence insufficient	Insufficient evidence to assign a stronger status.	Show exactly what evidence exists underneath.
Loading initial dataset	Loading atlas index…	{graph/matrix geometry} appears without fabricated counts
Loading cell evidence	Loading evidence…	Selected coordinate remains visible
Dataset failure	Atlas data could not be loaded.	The interface is available, but evidence and status data are unavailable. + RETRY
Evidence-section failure	Evidence could not be loaded for D.04 × C.11.	Preserve already-loaded relation metadata
Malformed/inconsistent data	Validation error in atlas data.	Show dataset revision + machine-readable error ID; do not silently classify the relation

Loading uses stable geometry, not a spinner: hairline matrix cells render with their status marks withheld, ledger fields show an em dash —, and a single Loading atlas index… readout tells the truth. There are no fake skeleton statistics and no animated shimmer.

7. Focus ring

Every interactive control uses one focus language: 2px solid #1B1A18, outline-offset 2px, with a 1px #F6F3EC separation where the focused object itself can be dark or coloured. For matrix cells, external outlines would collide with neighbours, so use an inset 0 0 0 2px #1B1A18 plus inset 0 0 0 3px #F6F3EC; the active row and column also receive 1px ink guide rules. Do not use blue as the generic focus colour because blue already has scientific meaning. :focus:not(:focus-visible) gets no artificial ring. Focus never relies on colour alone and is never animated.

8. Compact implementation tokens

I would freeze these now; this gives the implementer a coherent first-pass system rather than forcing local aesthetic decisions.

CSS
:root {
  /* surfaces */
  --surface: #F6F3EC;
  --surface-raised: #FBF9F4;

  /* neutral ink */
  --ink: #1B1A18;
  --ink-secondary: #5D5A54;
  --hairline: #D6D0C5;
  --unsearched: #D7D3CA;
  --insufficient: #66635D;

  /* epistemic/status */
  --status-established: #1B1A18;
  --status-demonstrated: #1F5D87;
  --status-theoretical: #6A4A86;
  --status-candidate: #1B1A18;
  --status-searched-none: #8A5A16;
  --status-not-searched: #D7D3CA;
  --status-forbidden: #1B1A18;
  --status-contradicted: #9C3B31;
  --status-insufficient: #66635D;

  /* pathway checks */
  --check-pass: #1B1A18;
  --check-fail: #9C3B31;
  --check-unresolved: #8A5A16;
  --check-unknown: #5D5A54;

  /* fonts */
  --font-heading: "Source Serif 4", serif;
  --font-ui: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;

  /* type */
  --text-page-title: 30px;
  --leading-page-title: 34px;

  --text-section: 20px;
  --leading-section: 25px;

  --text-subsection: 15px;
  --leading-subsection: 20px;

  --text-body: 14px;
  --leading-body: 20px;

  --text-ui: 12px;
  --leading-ui: 16px;

  --text-data: 11px;
  --leading-data: 15px;

  --text-micro: 10px;
  --leading-micro: 13px;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;

  /* geometry */
  --header-height: 44px;
  --ledger-height: 56px;
  --probe-height: 28px;
  --status-rail-height: 28px;

  --matrix-cell-home-w: 24px;
  --matrix-cell-home-h: 20px;
  --matrix-cell-w: 40px;
  --matrix-cell-h: 32px;
  --matrix-cell-phone-w: 32px;
  --matrix-cell-phone-h: 28px;

  --matrix-row-axis: 184px;
  --matrix-row-axis-phone: 112px;
  --matrix-column-axis: 76px;
  --matrix-column-axis-phone: 48px;

  --drawer-width: 440px;

  /* borders */
  --border-width: 1px;
  --border: 1px solid #D6D0C5;
  --border-strong: 1px solid #1B1A18;
  --family-divider-width: 2px;

  /* radii */
  --radius-none: 0px;
  --radius-control: 2px;
  --radius-panel: 0px;

  /* shadows */
  --shadow-none: none;
  /* drawers are separated by a border, never drop shadow */

  /* focus */
  --focus-color: #1B1A18;
  --focus-width: 2px;
  --focus-offset: 2px;
  --focus-separator: #F6F3EC;

  /* hatch */
  --hatch-angle: 45deg;
  --hatch-line: 1px;
  --hatch-period: 5px;

  /* motion */
  --duration-probe: 120ms;
  --duration-reflow: 180ms;
  --duration-drawer: 220ms;
  --duration-graph: 280ms;

  --ease-probe: cubic-bezier(0.2, 0, 0, 1);
  --ease-reflow: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-drawer: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-graph: cubic-bezier(0.22, 1, 0.36, 1);

  /* z layers — deliberately shallow */
  --z-base: 0;
  --z-sticky-axis: 10;
  --z-header: 20;
  --z-drawer: 30;
  --z-focus: 40;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-probe: 0ms;
    --duration-reflow: 0ms;
    --duration-drawer: 0ms;
    --duration-graph: 0ms;
  }
}

The one thing I would be particularly strict about during implementation is not allowing “unknown”, “not searched”, “searched and nothing found”, “insufficient evidence”, “candidate”, and “forbidden” to collapse back into a generic empty/grey state. That distinction is not visual polish; it is part of the scientific data model. The interface becomes much more interesting precisely because a blank-looking square can represent several fundamentally different states of knowledge.