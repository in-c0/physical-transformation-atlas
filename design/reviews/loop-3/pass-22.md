# Pass 22 — Scholar runs for the thermocapillary streaming route, the parallel-driver rule, and the head rule (20/09/2026 11:17 pm – 21/09/2026 12:12 am Sydney)

Focus sent: (A) the four Google Scholar forms for p-423a19acdd run by hand (100 screened per form; Scholar
returns nothing beyond about 32 words, so compact strings from the frozen bundles), what Scholar's full-text
index surfaced that OpenAlex could not — a cluster of solar-evaporator hydrovoltaic papers invoking a thermal
Marangoni flow as an enhancer, Zhang et al. 2026's solutocapillary co-driver device, Glockner & Naterer's
thermocapillary micro heat engine, Dietzel & Hardt 2011, and a capillary-wicking paper caught by the alias
"surface-tension-driven flow"; (B) decisions, a co-driver rule, alias hygiene, a Scholar exception for the
protocol, and what to do with the micro heat engine; (C) the rule pass 21 exposed — 24 of the 32 derived
compositions were derived by the shared-head clause alone and every one diverges at the second mechanism —
with three options; (D) pass 23. ChatGPT (High, ~4 min). Verdict: PIVOT — 14 findings.

Verification before recording: Zhang 2025 (CEJ 172116) and Lei 2025 (Composites B 113111) abstracts on the
publishers' pages (the 0.3 V is attributed to the engineered salt gradient; Lei's Marangoni discussion is in
the text); Zhang 2026 (AFM), Chen 2024 (AEM), Glockner & Naterer 2007 and Chan 2013 abstracts on OpenAlex;
Odukoya & Naterer 2013 read in full from the authors' Memorial University copy — the 1.2–1.3 mV and 1.6 %
the reviewer cited are simulation results for the fabricated PZT device, the experiments characterise the
microheaters and the droplet motion; Russo 2017 abstract and highlights on the publisher's page (3.35
nW cm⁻², 0.289 %); Chan 2013 (344 mW over 1 cm², 2.5 % of 13.7 W). Yang 2007's abstract was not reachable
and it is not recorded.

## Applied

1. Decisions (findings 1, 3, 7, 9): the five evaporator papers `driver-only-modifies`, the reviews
   `review-only`, Zhang 2026 `driver-only-modifies` on the solutocapillary route (recorded there with the
   thermal sibling's Scholar run as its finder), Glockner & Naterer `constituent-only` with the reviewer's
   reason plus the full-text finding on Odukoya 2013, Dietzel & Hardt `theory-only`, Das 2018
   `wrong-driver`. The p-423a19acdd record gains the four Scholar runs (`query_compacted: true`,
   `expanded_query` holding the unabridged form; counts 19,200 / 282 / 105 / 79 reported, 100 / 100 / 95 /
   69 screened), nine hits, and a conclusion that says what was searched; still `inconclusive` /
   `partial` (Semantic Scholar keyless, two Elsevier chase hits unread).
2. Protocol (findings 2, 6): the parallel-driver rule pasted verbatim into route-search-v1 §3 after item 4,
   and the Google Scholar query-length exception into §2 — a compact run keeps one term per required
   concept, stores the literal string, is marked `query_compacted` with its `expanded_query`, and fulfils
   the same key; the observed limit lives in the run note, not the protocol. Schema fields added.
3. Aliases (finding 5): "surface-tension-driven flow" removed from the Marangoni effect (capillary
   imbibition has no surface-tension gradient), "surface-tension-gradient-driven flow", "thermal Marangoni"
   and "thermal Marangoni effect" added.
4. The solutocapillary pathway (finding 4) keeps `proposed` and gains Zhang 2026 as evidence with the
   reviewer's note; its figures stay off the measurements.
5. The head rule (findings 8–10): option (ii). `derivedByClaims` no longer fires on a bare shared head; a
   route is derived by claims when it contains the whole pathway, is a strict prefix or suffix of it, its
   shared claims span two phenomena, or it shares the driver step and first conversion and the next
   conversion phenomena at the first divergence share a coupling family. Documented in status-model.md,
   the vocabulary and /methods; the build test's mirror of the rule updated; a frontier regression test
   asserts the reviewer's negatives (TOEC → turbine, thermomagnetic → streaming, thermal expansion →
   flexoelectric, elastic → elastocaloric, Marangoni → generator-action are candidates) and positives
   (PRO → lift, fission → expansion stay derived). 62/62.
6. Known devices the rule had hidden (findings 11–12), recorded as pathways after the source reads:
   `combustion-microthermophotovoltaic-generator` (Chan et al. 2013, K6, 2.5 % and 3440 W/m²) and
   `radioluminescent-nuclear-battery` (Russo et al. 2017, K6, 0.289 % and 3.35 nW/cm²), each with a
   transducer and implemented_by claims; both routes are now demonstrated, and their light-only
   truncations left the frontier as strict prefixes.
7. Not done, per finding 13: no pathways for the other returned routes. The default frontier now shows
   12 candidate compositions (from 2): the two Marangoni streaming generators, TOEC → turbine,
   thermomagnetic → streaming, thermoacoustic → acoustoelectric, thermal expansion → flexoelectric,
   elastic → elastocaloric, Marangoni → generator-action, evaporation → induction, hydrostatic descent →
   induction, fission → thermal emission → light, fission → MHD — to be triaged by data (known device →
   pathway; truncation → derived; genuine family change → candidate), not by heuristic.

## Open for pass 23

The thermocapillary micro heat engine (Odukoya & Naterer 2013) has no route to attach to: the atlas's
`carrier:fluid-flow` drives lift, flow-induced vibration and streaming only, and the Marangoni flow provides
`flow:liquid`/`flow:interfacial`, while thermocapillary pumping of a confined plug moves the bulk — the
spelling (a fluid-flow → elastic-deformation claim with its handoff tokens, and whether a confined plug
provides bulk flow) is put to the reviewer before anything is recorded. Pass 23 as recommended: the
Scholar forms for p-41cb505083, then the thermomagnetic → streaming route (p-1043a15e01), which pass 18
searched as a candidate and the head rule had hidden.

Result: revision 11f1952bcc91 — 487 claims · 180 sources · 82 pathways · 791 routes · 78 demonstrated ·
6 reviewed searches · 12 candidate compositions on the default frontier · axe clean · exports valid · live.
