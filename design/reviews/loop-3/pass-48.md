# Pass 48 — the electrical output-form / terminal-boundary audit (21/09/2026 10:55–11:20 pm Sydney, build; message after)

Built on the reviewer's pass-47 order (findings 13–14): prompted by the antenna hit, applied atlas-wide —
a generated, gated report over everything that ends at electrical work, with no token, carrier or schema
field for a waveform (findings 3, 5, 14: typed structure only where a downstream requirement consumes it).

## Built

1. `design/reviews/loop-3/pass-48-dispositions.yaml`: 44 producer rows (one per claim delivering one of
   the five electrical carriers — the phenomenon → carrier step of every electricity-ending route) with
   `form` recorded only where an atlas record states it (quoted in `stated`: the antenna claim's "an
   oscillating current at the wave frequency", the rectification claim's "direct current out of the
   diode", the PV, betavoltaic and droplet data's own words) and `unspecified` otherwise — 38 of 44; the
   auditor's physics reading sits in its own column and never becomes a form. 55 boundary rows, one per
   electrical datum on a pathway or system: where the numerator sits (terminals · after-power-electronics ·
   grid · net-plant · per-event-peak · unstated) with the record's words.
2. `tools/audit-electrical-form.mjs` joins them to the compiled graph and writes
   `pass-48-electrical-form-audit.md`: the producers; the 67 pathways ending at electricity with the last
   phenomenon, producer claim, conversion claim (the load boundary), any conditioning stage after
   electrical power first exists (an electrical → electrical coupling into a further phenomenon — only
   rectification, on the rectenna) and whether a claim requires a form; the 540 routes grouped by terminal
   producer; the 54 electrical data with their boundary beside the record's own basis. The decisive fact is
   computed, not asserted: none of the 23 requirement tokens in use names a current form or waveform, so
   every form is descriptive ("form is merely descriptive" vs "a downstream claim requires it": the
   second set is empty).
3. Controls, gated (finding 14): the atomic antenna route reads rf-oscillatory with no conditioning stage,
   no requirement and stays a candidate; the rectenna reads dc with rectification as its conditioning
   stage and its 90.5 % datum after the diode; the hydro, wind and Rankine routes end in generator action
   with no form requirement and stay demonstrated; the PV module route has no conditioning stage, its
   datum at the module's terminals; the OTEC 47.4 kW reads grid ("grid-connected" in the record), the
   Nordjylland 47 % net-plant ("to the 400 kV grid"), Monroe's 60 % net-plant ("water-to-wire"), the μTPV
   2.5 % after-power-electronics ("after its maximum-power-point converter"); generic electricity carries
   no DC alias.
4. Data: "DC power" left `output:electricity`'s aliases (aliases build search plans, so they are
   semantic; DC is a form of electrical output, not a synonym) and its summary says the waveform is not
   part of the output unless a record narrows it. Boundaries found: terminals 29 · after-power-electronics 3
   (the rectenna element, the μTPV generator's two figures) · grid 1 · net-plant 4 · per-event-peak 9 ·
   unstated 8 (cycle and rotor figures before the generator, the gas turbine's 127 MW, the two unresolved
   pass-45 rows).
5. Pass-47 close (findings 4, 11–12): Rozzi et al. 2020 (Energies 13, 420, open review) read on the MDPI
   page — Section 3.2.2 restates the 30.6 % / 40.0 % ideal limits citing Fountaine as [389]; recorded as a
   review source; the two ideal-limit claims cite it and read established; the Real1 / Real2 benchmark
   claims stay reported on Fountaine alone.
6. Regressions: the pass-48 test (the gate; no requirement token names a form; the antenna route's class
   and its report line; the rectenna's conditioning stage and datum boundary; the alias and summary; the
   grid / net-plant / converter rows; PV and the generators demonstrated with no conditioning); the
   pass-47 test updated for the Rozzi evidence. 88/88.

Result: revision 02f726b52b7e — 353 entities · 524 claims · 235 sources · 93 pathways (92 + 1 variant) ·
2 systems · 771 routes · 86 demonstrated · 88/88 · axe clean · exports valid · six audit gates
consistent · live.

## Reviewed (sent 11:13 pm; ChatGPT High, ~7 min, with web search; PASS — 24 findings)

1. Pass 48 closes cleanly (findings 1–4): waveform is descriptive metadata, not a causal requirement
   anywhere in the atlas; the terminal-boundary treatment is right; the measurement-boundary categories
   stay a permanent audit and are never collapsed into scope or datum_kind — the μTPV's converter sits
   inside its efficiency boundary without the route acquiring a DC–DC phenomenon.
2. Rozzi (finding 5): acceptable under the evidence rule with one caveat kept in the presentation —
   Rozzi is secondary evidence pointing to Fountaine; "established" means established under the
   review-supported rule, not independently reproduced by a second modelling group.
3. Pass 49 rulings (findings 6–21): route-search-v1 is not relaxed — an engine that answers 429 or a
   captcha before the required depth leaves the route partial/blocked and inconclusive; OpenAlex +
   Crossref + chases never acquire protocol-complete-negative; no dated exception either (that would be a
   versioned route-search-v2 with a replacement-engine rule, not pass 49's business); Crossref is no
   substitute engine; a blocked request is evidence of an attempt, never of an empty result — record
   engine, literal query / key, time, blocker and positions screened, and never result_count 0 for a
   captcha page; Scholar continuation as written (de-duplicated positions across sittings complete a
   run; a captcha interrupts, never waives); composite-name is not applicable, never missing, when no
   source-backed composition term exists — and never a concatenation of route labels; a negative's
   obligations must be recomputed from the frozen plan at load (mandatory engines, decomposed keys, the
   conditional composite-name key, depth, chase count), never trusted from a stored label; monotonicity —
   extra OpenAlex runs or Scholar segments never turn partial into complete while a mandatory engine or
   key is incomplete; no stronger public label for partials (search-incomplete already says what the
   atlas knows; the site may show the date and the named limitation).
4. Pass 50 (findings 22–24): the whole-atlas closure audit treats incomplete searches as legitimate
   unresolved items — report the ten frontier searches by state with each partial's outstanding engine /
   key, plus Lu 2024's 2.46 % boundary, the shape-memory engine's heat-input definition, the deferred
   Planck fraction, every single-source reported constraint or claim, and every open source-read
   exception; the closure criterion is that uncertainty is typed, sourced and exposed, not eliminated.

## Closed (11:20 pm–12:05 am; finding 5 applied in pass 49, live at r7719df505447 with pass 49)

- The two ideal-limit claims' review lines and the Rozzi source note now say what "established" means
  here: a review that restates Fountaine's calculation citing it, not an independent replication.
