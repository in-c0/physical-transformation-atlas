# Pass 10 — the frontier as a research instrument (20/09/2026 ~2:30–3:25 pm Sydney)

Focus sent: after the fluid-flow carrier change (589 → 681 routes), judge the frontier as a physicist
deciding what to spend a month on — are the top ten right, which ordering key is wrong, classify
twenty sampled candidates (genuine / known device under another name / representation artefact /
incoherent), triage the 92 new fluid-flow routes with a rule for each demotion, and say what the row
fails to show. ChatGPT (High, 11 min). Verdict: PIVOT — 11 findings.

## Findings (condensed) and what was done

1. The top three (thermomagnetic convection → lift, Marangoni → lift, thermo-osmosis → lift) won on
   one seam + established constituents + ambient driver, not novelty; two are known devices (TOEC,
   thermomagnetic ferrofluid engines). → New lexicographic order: structure → core checks unresolved →
   carrier handoffs unresolved → device coverage → magnitude screen → search state → evidence floor →
   non-established constituents → driver availability → seams → energy transitions → length → id.
   `known_pathway_overlap.shared_claims` dropped as a key; seams demoted to a late tie-break.
2. `pathwayOverlap` missed routes whose first claim differs but whose mechanism is the same. →
   `closest_known_pathway` by longest common subsequence of phenomena (then claims), with relation
   `exact` / `source-variant` (shared tail ≥ 2 effects) / `sink-variant` (shared head) /
   `mechanism-subsequence`; a variant is `derived`, never a fresh candidate.
3. Representation equivalence only compared against named pathways. → Phenomena-identical collapse
   among compositions (same source, ordered phenomena, sink form; shortest claim sequence stays).
4. Twenty sampled routes classified. Known devices under another name are now recorded so the
   classifier can see them: `transducer:rotating-generator` (implements generator action and induction),
   `transducer:thermo-osmotic-energy-converter` + `pathway:thermo-osmotic-energy-converter` (Straub
   2016, 3.53 W/m² at 60/20 °C, turbine stage proposed), `transducer:bimetal-piezo-harvester` +
   `pathway:bimetal-piezoelectric-harvester` (Boughaleb 2016), `transducer:thermomagnetic-pump` (Lian
   2009), magnetoelectric-laminate implementations of Joule magnetostriction and the piezoelectric
   effect (Nan 2008). All three new DOIs Crossref-verified (136/136).
5. 60 of the 92 new routes first manufacture a temperature gradient and then append one flow chain.
   → Structural kind `source-preparation`: an internal ambient-common/ambient-conditional
   disequilibrium whose suffix is itself an enumerated route; `dominated_by` names the suffix.
   Restricted to ambient drivers on purpose — manufacturing an engineered pressure or stress *is* the
   composition. 332 routes reclassified.
6. Triage of the 32 direct fluid-flow routes. → Done by rule rather than by hand: the lift routes are
   demoted by handoff (Marangoni provides interfacial liquid flow, lift requires a bulk loadable
   stream); FIV → resonance → mechanical work routes are source-variants of the recorded FIV harvester;
   the streaming-potential and FIV → triboelectric/electrostatic variants stay as candidates with an
   unresolved handoff, ranked below resolved ones.
7. "Fluid flow" erased the state of the flow. → Optional claim field `handoff { provides,
   requires_all, requires_any }`; Marangoni provides `flow:liquid, flow:interfacial`; thermo-osmosis
   `flow:liquid, flow:confined`; thermomagnetic convection `flow:liquid, flow:bulk, medium:ferrofluid`;
   lift requires `flow:bulk + flow:loadable-momentum`; FIV `flow:reynolds-qualified` and any of
   bulk/confined; streaming potential `flow:liquid + surface:charged`. Compiler exports
   `handoff_unresolved_count` and `handoff_issues[]`; a missing provision is unresolved, never
   "impossible".
8. Magnitude coverage counted relations, not whether anything bounds the transmitted quantity. →
   `magnitude_screen { status: quantified | bounded | missing | incompatible, bottleneck_claim,
   detail }`; `incompatible` reserved for a recorded contradiction; sits before search in the order.
9. Decision facts were dispersed. → One line under the chain: `driver · search · weakest (step —
   status) · handoff · closest (pathway + relation | device)`; `device_coverage` added.
10. "0 conflicts · 0 implied interfaces" over-claimed. → Renamed "boundary tags: 0 recorded conflicts ·
    0 tag-conflict interfaces", with the sentence that tags only say what conflicts and the prose-
    required rotor/body/channel/membrane shows under handoff; the old "magnitude" line removed.
11. Regression tests. → `frontier.test.ts` (carrier-expanded spelling never a fresh composition;
    source-preparation names its suffix; Marangoni → lift has an unresolved `flow:bulk` handoff with a
    negative control; the TOEC pathway is no longer a candidate; the magnetostrictive source-variant is
    derived; no non-composition ever precedes a composition in the default order) and two synthetic
    structure tests (phenomena-identical collapse; source-preparation with a negative control).

Also this pass, before the reply arrived: family-core collapse (same source × ordered families × sink
form → one representative), `weakest_claim`, `implied_interfaces`, `closest_known_device`.

The axe gate caught one regression of my own (decision-line links distinguishable by colour only) —
underlined.

Result: 12 candidate compositions on the default frontier (from 91 at the start of the pass), 89
candidate-class routes classed as artefacts, 406 derived; 455 claims · 155 sources · 66 pathways ·
681 routes · 38/38 tests · exports valid · axe clean, live.
