# Pass 23 — the remaining Scholar runs, the micro heat engine's spelling, and the twelve released candidates triaged (21/09/2026 ~12:12–12:55 am Sydney)

Focus sent: (A) Google Scholar by hand for p-41cb505083 (all four forms; 11,800 / 261 / 68 / 53 reported) and
p-1043a15e01 (three narrow forms complete — 4, 1, 1 — and the driver-mechanism form cut off by a captcha
after one page, Scholar tolerating about 110 page loads in a sitting), with the lane's decisions on the
new hits; (B) the thermocapillary micro heat engine's spelling (a fluid-flow → elastic claim, or the
plug's compression as a pressure gradient; whether a confined plug provides bulk flow; what to record);
(C) the twelve candidate compositions the head rule released, one verdict each; (D) pass 24 and whether
Scholar's driver-mechanism form should become optional above 1,000 hits. ChatGPT (High, ~7 min, with
web and repository searches). Verdict: PIVOT — 20 findings.

Verification before recording: Chen et al. 2015 (Nat Commun 6:7346) read in full from the open-access
PDF — the HYDRA oscillator turned an electromagnetic generator, lit two LEDs and delivered bursts of
60 μW (1.8 μW average) into 100 kΩ; Asim et al. 2022 (Sustainability 14:6930) read on the publisher's
page — the tested waterwheel "was connected to a 3 kilowatt (kW) electrical generator, and the voltage
and current were measured at full load conditions" on a 1.54 kW appliance load; Glockner & Naterer 2006
metadata on OpenAlex; the reviewer's near-positive for candidate 6, Iwakiri, Miyata & Mori, "Observation
of universal thermopolarization effect in insulators" (arXiv:2605.17224, 17 May 2026), confirmed on arXiv:
a temperature gradient's thermal expansion produces strain gradients whose flexoelectric polarization was
detected in MgO, Al₂O₃, MnO, mica, PET, PEN, polyimide and soda-lime glass, scaling with the expansion
coefficient — not yet read, pass 24's target.

## Applied

1. Records (findings 1–2): the five p-41cb505083 decisions stand; p-1043a15e01's four incidental hits
   recorded as simulation-only / review-only / wrong-coupling; both stay inconclusive / partial. The
   captcha-cut driver-mechanism run carries `segment: 1`, `positions_screened: "1–10"` and its
   interruption, under the new continuation rule.
2. Protocol (finding 20): Scholar's driver-mechanism form stays mandatory; the "Scholar throttling and
   continuation" paragraph pasted into route-search-v1 §2 verbatim, with `segment`,
   `positions_screened` and `interruption` on runs in the schema.
3. The micro heat engine (findings 3–6): the reviewer's spelling (b) with a regime-specific claim —
   `claim:marangoni-produces-confined-flow` (demonstrated; provides flow:liquid, flow:confined,
   flow:bulk, flow:directed-momentum; the free-surface claim untouched) and the bridge
   `claim:marangoni-produces-pressure` (theoretically-predicted: the pressure feeding the membrane
   comes from the model); pathway `thermocapillary-piezoelectric-micro-heat-engine`, status proposed,
   K3, the modelled 1.2–1.3 mV and ≈ 1.6 % recorded at scope model only. One compiler consequence
   caught and fixed before deploying: the reviewer's energy forms (mechanical in) failed the
   continuity check against `temperature-drives-marangoni` (kinetic out) — the claims take kinetic.
   The route is now enumerated (p-b7667759aa, class weak because the bridge claim is below
   demonstrated), and the 36 new routes the confined-flow claim opens are all representation
   artefacts, source preparations or round trips — none reached the default frontier.
4. Known devices (findings 15–16), recorded after the reads: `evaporation-driven-generator` (Chen
   2015, K6, 60 μW bursts / 1.8 μW average) and `waterwheel-electric-generator` (Asim 2022, K7, a
   1.54 kW load run on a 3 kW generator; wheel efficiency 72–77 %), with transducers and
   implemented_by claims. The default frontier shows 10 candidate compositions.
5. The reviewer's priorities and first queries for the eight genuine candidates (findings 7–14, 17–18)
   are the search order from here: P1 thermal expansion → flexoelectric (the thermopolarization
   preprint), P2 thermoacoustic → acoustoelectric (the atlas's acoustoelectric effect is Weinreich
   carrier drag, so Zheng 2022's piezoelectric "acoustoelectric" PAN membrane is a different family),
   P3 thermal Marangoni rotor → generator, P4 the two Marangoni streaming routes, P5 TOEC → turbine
   (blocked on the Luo 2024 read), P6 thermomagnetic → streaming, P7 vibration → elastocaloric, P8
   fission → MHD, P9 fission → thermal emission → light (the nuclear light bulb's radiant tests used
   arc plasmas; the fissioning-plasma spectral experiment is the thing to read).

Result: revision dcc951c36d43 — 493 claims · 182 sources · 85 pathways · 863 routes · 80 demonstrated
· 6 reviewed searches · 10 candidate compositions · 62/62 · axe clean · exports valid · live. Pass 24:
candidate 6 — read arXiv:2605.17224, write the route plan for p-a093d7ecc5, run it, and put the
"polarization measured, work not delivered" question to the reviewer.
