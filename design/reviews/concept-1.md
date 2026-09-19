# Concept review 1 — three directions (ChatGPT temporary chat, 19/09/2026 ~10:30 am Sydney)

Stage 1 of the UI/UX workflow. Prompt: design/BRIEF.md + the banned-defaults list, asking for three directions. Verbatim reply below. Claude's critique and the resolved direction are in concept-2.md and DESIGN.md.

---

I’d treat the three directions as different answers to “what kind of scientific instrument is this?” rather than different branding exercises. All three keep the same information architecture, status semantics, and scientific restraint.

Contrast ratios below are WCAG relative-luminance ratios against each direction’s base surface, rounded to two decimals. The deliberately pale unsearched colour is not used for text; it is an absence-state fill, with ink-coloured labels/focus outlines.

Direction A — Calibrated Ledger

Thesis: The atlas behaves like a continuously updated experimental ledger: every visible thing has a coordinate, provenance, state, and measurable relationship to the underlying dataset.

This is the closest synthesis of research paper × IDE × laboratory instrument.

Palette
Role	Hex	Contrast on surface
Surface	#F6F3EC	—
Raised surface	#FBF9F4	—
Ink / established	#1B1A18	15.69:1
Secondary ink	#5D5A54	—
Hairline	#D6D0C5	—
Demonstrated / measured	#1F5D87	6.37:1
Theoretical	#6A4A86	6.45:1
Unresolved	#8A5A16	5.33:1
Contradicted / failed	#9C3B31	6.15:1
Unsearched	#D7D3CA	1.35:1
Insufficient evidence	#66635D	5.40:1

Insufficient evidence is not a solid fill. Use #66635D as a 1px diagonal hatch at 6px spacing over the normal surface.

Typography

Heading: Source Serif 4
UI: IBM Plex Sans
Data / identifiers: IBM Plex Mono

Source Serif gives phenomenon/pathway pages the authority of a paper without turning the entire application into editorial design. Plex Sans and Mono feel engineered rather than fashionable, and their family resemblance keeps dense mixed scientific notation coherent.

Function	Font	Size / line-height	Weight
Page title	Source Serif 4	30 / 34px	600
Major section	Source Serif 4	20 / 25px	600
Subsection	IBM Plex Sans	15 / 20px	600
Body	IBM Plex Sans	14 / 20px	400
Primary UI	IBM Plex Sans	12 / 16px	500
Data / matrix	IBM Plex Mono	11 / 15px	400
Micro metadata	IBM Plex Mono	10 / 13px	500

Do not uppercase whole headings. Reserve uppercase mono for very small structural labels such as EVIDENCE, CONDITIONS, SEARCH STATE.

Home composition

No hero.

The viewport begins immediately with a 44px instrument header:

PHYSICAL TRANSFORMATION ATLAS ATLAS MATRIX FRONTIER COVERAGE METHODS

Below it, a 64px live ledger rail running the entire width:

4,281 CLAIMS | 736 PHENOMENA | 1,194 DIRECT RELATIONS | 386 PATHWAYS | 219 UNRESOLVED

Those are typographic readouts separated by vertical hairlines, not KPI cards.

The main area is approximately 70/30.

The left 70% is the actual Cytoscape atlas, beginning above the fold. It has a small coordinate/legend rail across its top and no decorative container around it.

The right 30% is an observation register, not a sidebar:

CURRENT ATLAS
Last evidence change          …
Coverage                      …
Relations by status           …
Most connected gradients      …
Recently substantiated        …

The lower edge of the viewport contains a narrow domain coverage strip—thermodynamics, electrochemistry, mechanics, optics, spin, transport—not another collection of cards.

Matrix composition

The matrix should feel like a serious piece of apparatus.

A sticky top axis contains coupling families. A sticky left axis contains disequilibria. Family boundaries use slightly stronger rules than ordinary cell boundaries.

Each cell is roughly 40×32px at the default density. The cell itself carries almost nothing:

established: dark 4px centre mark

demonstrated: blue 4px centre mark

theoretical: violet outlined 6px square

unresolved: amber corner notch

contradicted: red diagonal slash

unsearched: pale grey field

insufficient evidence: hatch

No words like “Established” repeated inside 800 cells.

Keyboard focus is a 2px ink rectangle inset 1px, always visible.

Selecting a cell does not obscure the matrix. The matrix contracts horizontally and a 440px evidence drawer enters from the right.

Evidence drawer

The drawer is one continuous ruled sheet:

ΔP × THERMOELECTRIC
Direct relation

NO CANONICAL RELATION CURRENTLY RECORDED
────────────────────────────────────────

KNOWN BRIDGES                                      03

01  pressure gradient
    → fluid motion                   ESTABLISHED
    → temperature gradient           DEMONSTRATED
    → thermoelectric response        ESTABLISHED

    3 / 3 constituent relations established
    complete composition searched        NO
    direct demonstration found           NO

    [OPEN PATH]
────────────────────────────────────────

SEARCH RECORD
…

The status language is scientific and explicit. Never say “No results” when what you know is “not currently represented in this dataset.”

Motion

Motion communicates state transition and spatial continuity, never decoration.

Drawer:
220ms cubic-bezier(0.22, 1, 0.36, 1)

Matrix reflow:
180ms cubic-bezier(0.33, 1, 0.68, 1)

Graph camera transitions initiated by the user:
280ms cubic-bezier(0.22, 1, 0.36, 1)

Focus movement, status changes, numerical readouts:
0ms.

Nothing fades in because the user scrolled. Nodes never breathe, pulse, float, or glow.

With prefers-reduced-motion, the drawer appears immediately, graph camera jumps to its target, and selection changes are purely typographic/border changes.

Signature moment

The coordinate trace.

Select an empty matrix cell.

Its entire row and column acquire a single-pixel rule, visually connecting:

the disequilibrium → the empty relation → the coupling family → the evidence drawer.

Then any known multi-hop bridge places tiny indexed marks—1, 2, 3—at the corresponding intermediate relations elsewhere in the matrix.

For a moment, the user can literally see:

“This square is missing, but these three experimentally supported squares can route around it.”

That is specific to the Physical Transformation Atlas.

The lazy-AI failure

A generic implementation would turn the five live readouts into rounded KPI cards, put “Explore the hidden connections of physics” in a 64px headline above the graph, add blue-violet accents, then place Recent Discoveries / Trending Phenomena / Frontier Opportunities beneath it.

Calibrated Ledger refuses the entire premise.

The dataset itself occupies the first viewport. Readouts share a baseline. Sections are separated by rules, not boxes. There is no CTA because the matrix is the CTA.

Direction B — Surveyor’s Plate

Thesis: Treat physical possibility as unexplored territory: the UI borrows the coordinate discipline of scientific cartography, making demonstrated, theoretical, and unmapped regions legible as terrain.

This pushes hardest toward cartographic atlas × research paper.

Palette
Role	Hex	Contrast on surface
Surface	#F2EFE6	—
Raised surface	#FAF7EF	—
Ink / established	#20201D	14.21:1
Secondary ink	#5F5B53	—
Hairline	#CBC5B8	—
Demonstrated / measured	#275F7A	6.08:1
Theoretical	#70527F	5.70:1
Unresolved	#8C611A	4.76:1
Contradicted / failed	#9B4439	5.57:1
Unsearched	#D4D0C6	1.34:1
Insufficient evidence	#68655E	5.06:1
Typography

Heading: Literata
UI: Archivo
Data / coordinates: Azeret Mono

Literata adds a little more “atlas / scientific monograph” character than Direction A. Archivo is compact enough for dense controls without appearing like generic SaaS. Azeret Mono has unusually strong small-size identifiers and coordinate-like forms.

Function	Font	Size / line-height	Weight
Atlas title	Literata	28 / 33px	600
Section heading	Literata	18 / 23px	600
Strong UI	Archivo	14 / 18px	600
Body	Archivo	14 / 20px	400
Axis / UI	Archivo	12 / 16px	500
Coordinates / data	Azeret Mono	11 / 14px	400
Marginalia	Azeret Mono	10 / 12px	500
Home composition

The page resembles a modern survey sheet, not an antique map.

Across the top is a narrow index:

PTA / LIVE PLATE 01                          DATASET 2026.09.19

Below it, the atlas graph consumes about three quarters of the viewport.

The remaining quarter is a vertical legend/index margin containing the status legend, current coverage, dataset revision, evidence counts, and a short list of major domains.

There are small coordinate ticks around the graph perimeter.

Not latitude and longitude cosplay. They correspond to useful graph-space indexing, domains, or dataset partitions.

At the bottom edge:

ESTABLISHED ━  DEMONSTRATED ━  THEORETICAL ┄  UNRESOLVED ?  …

The user understands the visual grammar before reading an About page.

Matrix composition

This version leans into the atlas metaphor.

Every row gets an address such as:

D.04 Pressure gradient

Every column gets one such as:

C.11 Piezoelectric

Selected cell:

D.04 × C.11

Major physical families create survey blocks separated by 2px rules.

Coordinates remain sticky while scrolling.

At high density, statuses use marks rather than coloured backgrounds, so the overall matrix still looks predominantly warm-white and black.

The upper-left corner contains a compact two-axis legend:

DRIVER ↓
COUPLING →

No huge rotated axis titles.

Evidence drawer

A 408px plate margin opens from the right.

It looks like the explanatory margin on a scientific plate:

CELL D.04 × C.11

PRESSURE GRADIENT
× PIEZOELECTRIC

Direct relation
Not currently recorded

––––––––––––––––––

ROUTES AROUND THIS CELL

R1   ΔP → deformation → piezoelectricity
     2 / 2 relations established

R2   ΔP → flow → vibration → piezoelectricity
     2 established · 1 demonstrated

––––––––––––––––––

SEARCH EXTENT

Direct literature search       COMPLETE
Composite search               NOT COMPLETE
Validation                     —

Evidence citations appear as small numbered references in the outer margin rather than oversized chips.

Motion

Motion behaves like moving a viewing instrument over a map.

Route trace:
260ms cubic-bezier(0.16, 1, 0.3, 1)

Drawer:
200ms cubic-bezier(0.22, 1, 0.36, 1)

Graph reposition:
320ms cubic-bezier(0.16, 1, 0.3, 1)

Hover:
0ms border/ink change.

Nothing bounces or eases symmetrically.

The graph does not animate autonomously.

Reduced motion changes all navigation/repositioning to immediate state changes; route geometry appears fully formed.

Signature moment

Route surveying.

When an empty square is selected, known bridges are not confined to the drawer.

The system plots a thin survey route directly across the matrix:

D.04 → X.07 → P.13 → C.11

Intermediate cells receive numbered waypoints.

The drawer and matrix use matching route IDs:

R1, R2, R3.

Clicking R2 isolates that chain.

The matrix stops being merely a lookup table and becomes a map of how physical reality lets you travel from one transformation to another.

The lazy-AI failure

A weaker interpretation hears “atlas” and produces cream paper textures, compass roses, ornate serif typography, map-pin icons, torn-paper panels, and decorative contour lines.

That would be thematic illustration, not instrumentation.

Surveyor’s Plate uses cartography structurally only: coordinates, indexing, route notation, margins, legends, hierarchy, and spatial continuity. No antique styling. No fake map artefacts.

Direction C — Bench Standard

Thesis: Present the Atlas as a metrology bench for interrogating proposed transformations: choose an input, inspect the coupling chain, and read the evidentiary and physical checks like measurements.

This emphasizes physical instrument × IDE most strongly.

Palette
Role	Hex	Contrast on surface
Surface	#F7F4ED	—
Raised surface	#FCFAF6	—
Ink / established	#181916	16.07:1
Secondary ink	#585A54	—
Hairline	#D2CEC4	—
Demonstrated / measured	#1F628F	5.97:1
Theoretical	#624B82	6.71:1
Unresolved	#8B5E12	5.16:1
Contradicted / failed	#A13D35	5.91:1
Unsearched	#D9D5CC	1.33:1
Insufficient evidence	#5D5F59	5.89:1
Typography

Heading: Newsreader
UI: Instrument Sans
Data / equations: JetBrains Mono

Newsreader is used sparingly—essentially where a paper would use a title. Instrument Sans gives the operational surfaces a precise contemporary form without slipping into generic dashboard typography. JetBrains Mono is excellent for equations, quantities, IDs, conditions, and pathway notation.

Function	Font	Size / line-height	Weight
Page title	Newsreader	27 / 31px	600
Section title	Instrument Sans	17 / 21px	600
Body	Instrument Sans	13 / 19px	400
Strong UI	Instrument Sans	13 / 17px	600
Controls	Instrument Sans	12 / 16px	500
Numerical / equation	JetBrains Mono	11 / 14px	400
Micro readout	JetBrains Mono	10 / 12px	500
Home composition

A 36px navigation rail sits at the top.

Below it is a continuous measurement header, about 70px high:

CLAIMS 4281    RELATIONS 1194    PATHWAYS 386
EVIDENCE SOURCES 2187    LAST INGEST …    COVERAGE …

Again: one continuous rail, zero KPI cards.

The main work surface has three conceptual zones without boxing them into three cards:

DISEQUILIBRIA          TRANSFORMATION FIELD             OUTPUTS
────────────────────────────────────────────────────────────────
temperature    ┐
pressure       ├────── Cytoscape field ─────────────── electrical
chemical μ     │                                        mechanical
strain         ┘                                        chemical

This is mainly a semantic orientation device. The graph remains freely structured rather than forced into a Sankey.

Along the bottom is a narrow live evidence trace:

CLAIM 04F2   substantiated
CLAIM 91A1   contradictory evidence added
PATH P-287   composition search incomplete

Only real changes from the dataset appear there.

Matrix composition

The matrix resembles a precision test panel more than a spreadsheet.

The selected row gets a subtle ink rule running from the left axis. The selected column gets the same from above.

Each cell has a tiny central status glyph.

When focused from the keyboard, an address appears in the top instrument rail:

PROBE   ΔT × SPIN-CALORITRONIC   [M.06 / C.18]

Space/Enter opens the drawer. Arrow keys move one relation at a time. Home/End move within the current family; Ctrl/Command+arrow crosses family boundaries.

Evidence drawer

Wider here: approximately 480px.

It is organized like a test readout:

PROBE
ΔT × spin-caloritronic

DIRECT
Demonstrated
12 supporting claims
3 independent material systems

CONDITIONS
T              240–610 K
gradient       …
material       …

COMPOSITION
ΔT
↓
magnon transport
↓
spin current
↓
electrical signal

CHECKS
energy source accounted for        PASS
carrier identified                  PASS
coupling evidenced                  PASS
complete chain demonstrated         UNKNOWN

EVIDENCE
…

No progress rings. No “82% confidence” unless such a statistic actually exists and has a defensible definition.

Motion

Movement resembles changing a physical control or probe—not cinematic transitions.

Probe selection:
120ms cubic-bezier(0.2, 0, 0, 1)

Drawer:
180ms cubic-bezier(0.2, 0, 0, 1)

Graph focus:
240ms cubic-bezier(0.22, 1, 0.36, 1)

Status glyph changes:
immediate.

Numerical values never animate upward from zero.

Nothing constantly ticks, scans, rotates, or flashes merely to imply that the system is “live.”

Reduced-motion mode removes graph interpolation and drawer translation entirely.

Signature moment

The pathway checksum.

Every composed pathway has a narrow physical-check strip:

SOURCE      CARRIER      COUPLING      CONSERVATION      EVIDENCE
  ✓            ✓            ✓               ?               ✓

Selecting a check highlights exactly which claims and pathway edges justify it.

For an unexplored candidate:

SOURCE ✓   CARRIER ✓   COUPLING ?   CONSERVATION ✓   EVIDENCE —

Click the ?, and the Atlas takes the user directly to the unresolved relation in the matrix.

So “plausible pathway” never becomes a vague AI assertion; the interface exposes precisely where the physical argument stops being supported.

The lazy-AI failure

The danger here is an admin dashboard: dark left sidebar, topbar, six modules, status pills, coloured gauges, charts inside cards and fake “system health.”

Bench Standard refuses dashboard modularity.

There is one continuous scientific work surface. Components exist because they correspond to parts of an investigation—probe, field, evidence, checks—not because a UI kit offered a Card component.

Recommendation — Calibrated Ledger

I would build Direction A.

It has the strongest match to the actual epistemic structure of the project. The canonical unit is a claim; claims have evidence; relations compose; absence has several meanings; provenance matters. A ledger naturally makes those distinctions visible without turning the site either into a decorative map or a dashboard.

More importantly, it gives you a hierarchy that should survive enormous growth:

claim → relation → pathway → matrix coordinate → corpus-wide atlas.

Its home page can remain compelling with 500 relations or 500,000 because the spectacle is the dataset itself.

I would make its defining visual object this:

                     COUPLING FAMILY
                         ↓
                 ┌─────────────────┐
DISEQUILIBRIUM → │       □         │ ──────────────→ EVIDENCE TRACE
                 └─────────────────┘
                         │
                         │ known bridge
                         ↓
                    relation 01
                         ↓
                    relation 02
                         ↓
                    relation 03

An empty square should visually have as much intellectual weight as a populated one.

That, to me, is the core identity of the Physical Transformation Atlas. Most scientific databases make missing information disappear. This instrument makes a precisely defined absence inspectable: what is known around it, what has actually been searched, what physics permits, and exactly what experiment or literature evidence would change its status.