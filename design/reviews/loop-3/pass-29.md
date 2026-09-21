# Pass 29 — P7, P8 and P9 searched: every frontier candidate now carries a record (21/09/2026 11:13–11:45 am Sydney)

Focus sent: (A) P7, the vibration → elastocaloric route p-4d6800fa81 under route-search-v1 with the
reviewer's first and precision queries; (B) P8, fission → hot gas → MHD (p-ccef4f212b), and (C) P9,
fission → hot gas → thermal emission → light (p-8200d7ab7e), both run ahead of order while OpenAlex
was answering, with the lane's decisions from ten abstracts and two questions — did any fission-heated
MHD generator ever run, and which composition terms with which sources; (D) whether an open primary
can replace the paywalled Trepakov 1989 for the thermopolarization claims' upgrade; (E) pass 30.
ChatGPT (High, ~5 min, with web search). Verdict: PIVOT — 21 findings.

Verification before recording: Kien & Harada 2006 (Trans. JSASS 49:109–116), Williams 1971 (AIAA
71-1510), Anghaie, Smith & Knight 2002 (OSTI 850575), Latham & Rodgers 1972 (AIAA 72-1093), Schneider
& Thom 1975 (Nucl. Technol. 27:34–50) and Lee, McFarland, Hohl & Kim 1974 (Nucl. Technol. 22:306–314)
resolved on Crossref — the reviewer's "Sherman 1971" and "Williams & Shelton 1971" citations could not
be resolved as given, so Williams 1971 and Anghaie 2002 carry the gas-core terms instead; the P8
abstracts (Maya 1993, Welch 1995, Watanabe 1992, Ellis & Sprague 1966, Litchford & Harada 2011,
Lewellen & Grabowsky 1962, Beckurts & Schretzmann 1962) read on OpenAlex; Pavshuk & Panchenko 2008's
abstract per the reviewer (designed, not measured).

## Applied

1. P7 (finding 1): aliases vibration-driven / base excitation; six OpenAlex forms — 364 reported (150
   screened), mechanism-pair 6 (elastocaloric alloys under test-machine loading, constituent-only),
   whole-chain 0, precision 0, the reviewer's precision query 2 (the atlas's own Kumar 2019 proposal,
   proposal-only; a cryogenic strain cell, wrong-driver). Inconclusive / partial.
2. P8 (findings 2–6): aliases on the disequilibrium, fission and MHD generation; five decomposed
   forms (2,909 / 65 / 1 / 0) with ten decided hits — gas-core and vapor-core reactor MHD designs,
   numerical fissioning-gas flows and conductivity models, a neutron-induced helium plasma measured
   (constituent-only), Pavshuk 2008 proposal-only; then the composite-name form with four frozen
   terms (gas core reactor MHD; gaseous core reactor with MHD generator; NFR/MHD power generation;
   nuclear MHD power generation, broad) — 34 works, the nuclear-MHD concept literature of 1965–2006,
   six more hits. The reviewer's own search agrees no fission-heated MHD generator ever ran (Rosa's
   machine on an arc furnace, NASA Lewis's loop on its own heater); "fission-fragment-ionized plasma
   MHD" deliberately not frozen (a sibling mechanism). Inconclusive / partial.
3. P9 (findings 7–13): the decomposed forms reach only reactor-material emissivity papers; five
   composition terms frozen (nuclear light bulb; gas-core, gaseous-core and plasma-core reactor;
   fissioning uranium plasma — the last four broad) and the composite-name form returns the United
   Aircraft light-bulb programme (222 reported, 100 screened): spectral analyses (theory-only), RF and
   DC-arc radiant-environment simulations (wrong-driver, not source-variant — the driver is absent),
   the Nuclear Furnace in-reactor test designs (insufficient-information: whether any was run is the
   deciding question), a plasma test-reactor design. The reviewer's corrections recorded in the
   limitations: the Langley plasma-focus spectra are constituent-only, the Walters & Schneider
   neutron-field discharge at most driver-only-modifies. Inconclusive / partial.
4. Thermopolarization (findings 14–17): both claims stay reported; no open substitute for Trepakov
   1989 (Rafikov 1994 is not one); Kholkin, Trepakov & Nurieva 1986 (Sov. Tech. Phys. Lett. 12, 140)
   noted for the chase; the owner library read for Trepakov 1989 is the next owner action.
5. Pipeline: works with no publication year no longer break the bundle (two OSTI reports).

Result: revision a003e67ee0a0 — 503 claims · 208 sources · 88 pathways · 945 routes · 82 demonstrated
· 12 reviewed searches (every one of the ten frontier candidates now has a partial record; two of
them an observed pathway or a proposal besides) · 66/66 · axe clean · exports valid · live. Pass 30
(findings 18–21): the eighth physics check — driver / regime sufficiency — with the first regime
token `thermal:temporal-temperature-change`, `regime_requires` / `regime_provides` beside the carrier
handoff tokens, the pyroelectric spelling as the first regression (UNRESOLVED under a static
gradient), Seebeck PASS, thermoacoustic PASS only when Swift's threshold is represented.
