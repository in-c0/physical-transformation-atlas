# Pass 34 — the system layer: cascaded and bottoming cycles as SystemPathways (21/09/2026 2:00–2:25 pm Sydney, build; message after)

Built first, on the reviewer's pass-33 order (findings 12–26), then sent for review.

## Built

1. The two data defects first (findings 22–24): `pathway:combustion-gas-turbine` had
   `demonstrated_with: [transducer:rankine-cycle-plant]` — a new `transducer:gas-turbine-generator`
   (K8) with `claim:expansion-implemented-gas-turbine` replaces it; `efficiency_record: 0.64`
   removed, its own limit text having admitted it was the combined cycle's; the "Carnot at the turbine
   inlet temperature (≈ 1900 K → 84 %)" prose rewritten — the inlet temperature is an operating
   state (pass 31), the bound stays generic (Carnot between reservoirs a source defines; the ideal
   Brayton cycle's own limit 1 − r_p^((1−γ)/γ) named).
2. The schema (findings 13–17): `SystemPathway` (`system-pathway:` ids; `members[] {id, pathway,
   role}` with a descriptive role; `handoffs[]` = `SystemHandoff {from_member, to_member,
   from_energy_form, to_source, carrier, kind residual-energy | recovered-heat | mechanical-coupling |
   electrical-coupling | material-flow, conditions, evidence, status demonstrated | theoretical |
   proposed, note}`; `outputs[] {member, output, aggregation sum | separate}`; evidence, status
   demonstrated | prototype | commercial | proposed, knowledge level, performance, summary, review).
   Refinements: unique member ids, handoffs and outputs name existing members, a handoff joins two
   different members, a demonstrated handoff and a non-proposed system cite evidence. Routes and
   pathways stay one linear chain; a handoff is never a route claim.
3. The loader gate: members name existing pathways; `to_source` must be a disequilibrium AND the one
   the receiving member's route actually starts from; an output must be the member route's terminal
   output; carriers and sources exist.
4. The compiler: each member gains `pathway_name`, `pathway_status`, `route_id`, `route_checks`
   (the eight results of its exact route) and `core_unresolved_count`; the system gains
   `handoff_status` (weakest) and `members_core_clear` (every member route core-clear AND every
   handoff demonstrated). The eight checks are not run over a system (finding 21). Route
   enumeration, the matrix and the frontier are untouched: 751 routes before and after.
5. The surface: `/system` (index) and `/system/<slug>` pages (members with their routes' checks,
   handoffs with status, outputs, the system's performance, sources, a cite block); the member
   route pages say "Member of … as its topping-cycle"; `/api/systems.json` (`SystemsExport`,
   `canonical_url`), `systems[]` in the graph core, `counts.systems_named`, JSON-Schema `$defs.SystemPathway`,
   four vocabulary blocks; /coverage counts systems; /methods §2b explains the layer; docs/data-api.md
   (endpoint row, record paragraph, format history — additive within v0.4.0), README layout.
6. The first record (findings 18–20): `system-pathway:natural-gas-combined-cycle` — topping
   `pathway:combustion-gas-turbine`, bottoming `pathway:rankine-steam-plant`; one recovered-heat
   handoff thermal → `disequilibrium:temperature-gradient` via `carrier:hot-gas`, demonstrated on
   Al Mhanna 2024 (540.7 °C exhaust into two-pressure HRSGs, 61.5 MW steam turbine); both outputs
   electrical work, summed; status commercial (a 678 MW station's data); the 46.93 % as the
   system's plant-scope datum with the reviewer's basis and conditions and the arithmetic
   reproduction as a verification note.
7. Tests (finding 26.5): the system compiles with both member routes and all eight results; the
   46.93 % appears on the system and on no pathway or route; the gas-turbine pathway carries no
   record figure and its own transducer; the schema refuses an unknown member; the loader refuses a
   handoff whose `to_source` is not the receiving route's source (a temp copy of the canonical data);
   the axe gate covers the two new pages. 73/73.

Result: revision ba7022a9195a — 340 entities · 507 claims · 216 sources · 89 pathways · 1 system ·
751 routes · 83 demonstrated · 73/73 · axe clean (18 pages × 2 viewports) · exports valid · live.

## Reviewed (sent 2:24 pm; ChatGPT High, ~8 min, with web search; PIVOT — 33 findings) and applied (2:33–2:41 pm)

1. Architecture upheld (findings 1–3, 12, 17): systems outside enumeration, handoffs never claims,
   status commercial for the plant and demonstrated for its handoff, the 46.93 % where it is,
   `members_core_clear` false remaining correct.
2. The Rankine spelling's regime (findings 4–8): `claim:expansion-drives` now requires
   `thermal:spatial-temperature-gradient`, which its source provides — the bottoming member reads
   regime pass (110 routes pass, from 84); `claim:hot-gas-drives-expansion` deliberately does not
   (expansion through a pressure ratio, not a gradient-driven step), so the topping member stays
   unknown: "not yet machine-typed", never "may not work"; commercial / K8 never implies a pass.
3. Systems are measurements-only (findings 13–16): `SystemPerformance = { measurements[], notes? }`,
   strict, so `efficiency_typical`, `efficiency_record`, `theoretical_limit` and `power_density` are
   refused (tested for all four); the record's own limit line removed; any summary a page needs is
   derived from the structured data.
4. UI wording (finding 32): the page renders each member's actual state ("Combustion gas-turbine
   plant: 2 core checks unresolved · Steam Rankine plant: 1 core check unresolved") with the sentence
   that unresolved describes evidence coverage, never doubt about a plant that runs.
5. Recorded for pass 35 (findings 9–11): the gas-turbine route abstracts over the compressor and its
   back-work — `carrier:hot-gas` is named "Hot pressurised gas" while `claim:combustion-produces-hot-gas`
   guarantees no pressurisation; a later token such as `thermodynamic:expansion-pressure-drop` on the
   expansion step, supplied by a reviewed gas-turbine pathway, is not to be frozen until that audit
   decides how compressor work is represented; net-cycle efficiencies may not be commensurate with
   the expansion-only core.
6. Pass 35 confirmed and broadened (findings 18–31, 33): every legacy `efficiency_typical`,
   `efficiency_record` and `theoretical_limit` audited for provenance AND semantic scope in one
   deterministic table (dispositions verified-same-architecture · different-architecture ·
   unsupported-generic · ambiguous-basis · model-only · benchmark-not-bound · wrong-quantity ·
   migrate-to-measurement · remove), in the order cross-architecture → wrong limits/bases → records
   → typicals → limit prose; clear fixes named: the combustion heater's HHV "limit", OTEC's generic
   300/280 K Carnot number; audits named: the thermoacoustic 0.32, the Rankine 0.47, the thermionic
   0.15; the TEG 0.12 as positive control (then removed as a duplicate of its structured datum); a
   `typical` needs a population source; regression controls listed.

Result: revision f384cb3ddccd — 340 entities · 507 claims · 216 sources · 89 pathways · 1 system ·
751 routes · 110 regime pass · 73/73 · axe clean · exports valid · live.
