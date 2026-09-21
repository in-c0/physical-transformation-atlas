# Migrating a v0.4.0 reader to v0.5.0

The export format moved from **v0.4.0** to **v0.5.0** on 21/09/2026 (loop-3 pass 43). v0.4.0 is frozen at
`/api/schema/v0.4.0.json` as the pass-34 contract — the last revision of that format that was still additive —
and a regression hashes the file. Everything below is what a reader that validated against v0.4.0 has to
change. Ids, matrix addresses and canonical URLs are unchanged.

| v0.4.0 | v0.5.0 | why |
|---|---|---|
| `pathways[].performance.efficiency_typical` (number) | removed; the key is refused (`performance` is a strict object) | a typical needs a read population source and an explicit population rule; none existed (pass 35). Derive one only from a curated population of measurements |
| `pathways[].performance.efficiency_record` (number) | removed; a record efficiency is a physical-scope entry of `performance.measurements[]` with `metric: conversion-efficiency`, its `basis`, `parameters` and `sources`; pages derive the best recorded value | a naked number lost architecture, basis, gross/net and provenance (pass 39) |
| `pathways[].performance.power_density` (string) | removed; a density is a measurement whose `unit` states the per-unit and whose `normalization: { kind, basis }` names what the denominator refers to; an absolute power is `metric: power` with no normalisation | the same unit never implied a comparable density (pass 37) |
| `pathways[].performance.theoretical_limit` (string) | removed; a limit is a constraint entity reached through a `bounded_by` claim on a phenomenon on the route, or — for one exact architecture — a `pathways[].bounds[]` entry `{ constraint, evidence[], conditions[], note }`; the route's `thermodynamic-bound` check names what it evaluated | a limit lives in the typed constraint graph or nowhere (pass 42) |
| `paths[].frontier_class: "circular"` | `"same-form"` — the source disequilibrium and the sink carry the same energy form; nothing about anything returning to a starting state | the old name and its label "round trip" asserted a topology the compiler never checked (pass 41) |
| a numeric projection in prose | a model-scope measurement with `datum_kind` (`derived` / `design-point` / `simulated` / `projected`), evaluated against bounds as model-consistent or model-inconsistent, never deciding a physical route | pass 33 / pass 39 |
| a pathway supplying a regime token with no stated provider | a preceding route step that provides it, an `auxiliary_requirements[]` entry whose `establishes` names it (an off-route load or input), or a `regime_establishments[]` entry (`kind: implementation-process` — a process inside the implementation) | the loader refuses an unexplained provider for any token whose registry entry says one is needed (passes 36 and 43) |

Additive since the pass-34 contract, safe to ignore for a reader that skips unknown fields: `measurements[].normalization`,
`measurements[].datum_kind`, `measurements[].reference_constraint`, `pathways[].auxiliary_requirements[]`,
`pathways[].bounds[]`, `pathways[].regime_establishments[]`, the regime-token vocabulary `regime.token` and the vocabulary
blocks `pathway.auxiliary_requirement.kind`, `pathway.regime_establishment.kind`, `measurement.normalization.kind` /
`.basis` and `measurement.datum_kind`. The system layer (`graph.systems[]`, `/api/systems.json`, `counts.systems_named`)
entered in pass 34 and is part of the stable v0.5.0 contract.

A reader that validates strictly must load `/api/schema/v0.5.0.json`; `meta.schema` in every export names it. Older
exports whose `meta.schema` names v0.4.0, v0.3.0 or v0.2.0 still resolve against the frozen files.
