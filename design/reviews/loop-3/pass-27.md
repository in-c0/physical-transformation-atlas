# Pass 27 — the deferred runs, the composite-name form, and the thermopolarization literature it uncovered (21/09/2026 10:07–10:50 am Sydney)

Focus sent: the OpenAlex runs the reviewer ordered, executed once the anonymous pool reopened at
10:07 am — (B) the six forms for the thermoacoustic → acoustoelectric route p-231472e45e and the
lane's decisions on what they returned; (C) the flexo route's rerun with the thermoflexoelectric
aliases, a null result, and whether the protocol needs a form for a composition's own name; (D) two
spellings — the thermoacoustic → triboelectric composition Li 2026 demonstrates, and whether Smoker
2012's diaphragm wants its own interface record; (E) two loose ends of pass 26 — heat-exchanger-wall
records for the eleven gradient-fed demonstrated pathways, and the three untagged ones; (F) pass 28.
ChatGPT (High, ~4 min). Verdict: PIVOT — 20 findings.

Verification before recording: Li et al. 2026 (Nano Energy 155:112082) and Ahmed et al. 2025 (Energy
334:137745) read at abstract level on the publisher's pages — the piston-assisted engine with a
freestanding contact-separation TENG (0.49 mW peak at 80 MΩ, ≈ 150 °C heating, 1 μF to 17.05 V in
10 s, a wireless sensor) and the mercury–Kapton sliding TENG on a 31.3 W-acoustic engine (18.8 V /
3.2 μA per layer, 0.1 W m⁻² with 32 layers); Smoker et al. 2012 (JAP 111:104901) on Crossref; the
composite-name run's nine key abstracts read on OpenAlex (Trepakov, Nurieva & Tagantsev 1989;
Rafikov et al. 1994; Trepakov et al. 1995; Tagantsev 1991; Onishi et al. 2025; Kholkin, Trepakov &
Smolenskii 1982 and the 2026 quartz paper have no abstract on record).

## Applied

1. The runs (findings 1, 5): p-231472e45e — driver-mechanism 751 reported (150 screened),
   mechanism-pair 1 (the biomedical acoustoelectric effect: wrong-coupling), whole-chain, precision
   and the reviewer's frozen query 0; six new hits recorded (Smoker 2012, Chen 2019, Liu & Chen 2026,
   Li 2026 wrong-coupling; Bi 2017 constituent-only); inconclusive / partial with Scholar and
   Semantic Scholar outstanding. p-a093d7ecc5 — the alias rerun returned the same 158 works,
   recorded as a null result with its cause.
2. The composite-name form (findings 1–5): `composition_terms[] = { term, evidence, broad? }` on
   plans, records and bundles; `route-composite-name` / key `composite-name` in the query forms;
   the reviewer's §2 paragraph in the protocol verbatim; the loader requires the form on every
   engine before a protocol-complete negative once a term is frozen. Frozen for p-a093d7ecc5:
   thermoflexoelectric effect, thermo-flexoelectric effect, thermoflexoelectricity (Wei 2024) and
   thermopolarization (Iwakiri 2026, marked broad). Its first OpenAlex run: 45 works, 44 never seen
   by any decomposed form — the thermopolarization literature of Kholkin, Trepakov and Tagantsev
   (currents measured in dielectrics from 1982; SrTiO₃, KTaO₃ and KH₂PO₄ by 1989, with a "proper"
   non-flexoelectric thermopolarization separated from the flexoelectric "tertiary pyroeffect";
   the dynamic response in relaxor paraelectrics by 1994), Tagantsev's 1991 unification, the 2025
   Nano Letters theory (Onishi, Isobe, Shitade & Nagaosa), the 1995 converse "dielectric Peltier"
   effect and the 2026 quartz companion. Nine hits recorded — the measurements as
   insufficient-information until the reviewer rules whether "proper" thermopolarization is a
   distinct coupling the atlas lacks, the theories as theory-only / review-only, the converse and
   the quartz paper as wrong-coupling. The record stays inconclusive / partial.
3. The thermoacoustic triboelectric harvester (findings 6–10): `claim:acoustic-wave-drives-
   triboelectric` (the piston is coupling apparatus inside the condition; scoped requirements on the
   triboelectric element), transducer and pathway at K6 with the 0.49 mW peak and the ≈ 150 °C
   condition (the storage observation in a note, not as power), implemented_by claims, and the
   demonstrated `interface:thermoacoustic-triboelectric-piston`; Ahmed 2025 recorded as a source
   for a future gas–liquid variant, not on the piston record.
4. Interfaces (findings 11–12): the PAN record renamed `interface:thermoacoustic-piezoelectric-
   gas-solid`, its region `piezoelectric-element`, its evidence Zheng 2022 and Smoker 2012 — one
   physical handoff in two geometries; no second record.
5. Loose ends (findings 13–18): no heat-exchanger-wall records for produced-gradient handoffs (the
   node is the handoff, the wall is apparatus); the three untagged demonstrated pathways given
   universal requirements — heat conduction `temp-gradient-required` on the conducting medium,
   thermal emission the same on the emitter, radiative cooling the new environment tag
   `env-radiative-sky-access` on the sky path — so every one of the 82 demonstrated routes is now
   boundary-pass, meaning only that its recorded requirements do not conflict.
6. Pipeline: a free `OPENALEX_API_KEY` (and the other keys) read from a git-ignored `.env`; owner
   exception `2026-09-21-physical-transformation-atlas-literature-search-6a0d` filed for the key;
   route bundles keyed by id so reruns sit beside the frozen lists records cite. Tests 66/66.

Result: revision b57b6e13125f — 500 claims · 195 sources · 88 pathways · 929 routes · 82 demonstrated
· 8 reviewed searches · 4 interface records · 10 candidate compositions · 66/66 · axe clean · exports
valid · live. Pass 28 (findings 19–20): straight to route-search-v1 for thermal Marangoni → generator
(M1 Marangoni effect, M2 generator-action; the reviewer's first and precision queries), with the
thermopolarization question — a direct phenomenon beside the flexoelectric route? — put alongside.
