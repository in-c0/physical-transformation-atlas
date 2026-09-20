# Pass 25 — thermoacoustic → acoustoelectric as physics: the travelling-wave handoff, two constitutive relations, and a bounded candidate (21/09/2026 ~1:40–2:18 am Sydney)

Focus sent: candidate 5 (the reviewer's P2), temperature gradient → thermoacoustic effect →
acoustic wave → acoustoelectric effect → electrical work, taken as physics first because every
engine was closed this sitting (OpenAlex's shared anonymous daily budget exhausted until 10:00 am
Sydney; Semantic Scholar keyless; Google Scholar captcha). (A) the plan and aliases written, no
run; (B) the implied gas→solid interface — GENUINE / KNOWN DEVICE / ARTEFACT / BLOCKED; (C) the
constitutive relations the route's two drives-steps should carry (Swift's critical gradient; the
Weinreich relation) with primary sources, and an order-of-magnitude bound for a Backhaus–Swift-class
engine; (D) the reviewer's own web search for any thermoacoustic → classical-acoustoelectric
experiment; (E) pass 26. ChatGPT (High, ~17 min, with web search). Verdict: PIVOT — 19 findings.

Verification before recording: every named source resolved on Crossref — Yazaki, Iwata, Maekawa &
Tominaga 1998 (PRL 81:3128), Backhaus & Swift 2000 (JASA 107:3148–3166), Weinreich 1957 (Phys. Rev.
107:317, "Ultrasonic Attenuation by Free Carriers in Germanium"), Weinreich, Sanders & White 1959
(Phys. Rev. 114:33), Zheng et al. 2022 (Nano Energy 95:106995; abstract read on the publisher's page:
piezoelectric conversion, 118 V / 12 μA / 392 mW m⁻² under 118 dB at 230 Hz, and 102 V / 10 μA on a
mini thermoacoustic engine running 30 LEDs and charging a battery), Atashbar et al. 2026 (Nat.
Commun. 17:8932, open access, results read: 90.39 μA and 341.72 mV at 20 dBm with a 50 V gate, 17 μA
and 225 mV ungated). The dimensional forms of both relations were checked by hand before the compiler
checked them: K/(Pa·m) × Pa = K/m; A/W × W/m² = A/m². The reviewer's estimate was re-derived: helium
at 30 bar Z ≈ 4.9 × 10³ rayl against germanium ≈ 2.9 × 10⁷ rayl gives T_I ≈ 7 × 10⁻⁴; μΓ/v_s with
μ = 0.4–1 m² V⁻¹ s⁻¹, Γ = 10⁻³–10⁻² m⁻¹, v_s ≈ 5 × 10³ m s⁻¹ on ≈ 0.5 W gives 4 × 10⁻⁸–10⁻⁶ A; a
1 cm × 1 cm² n = 10¹⁵ cm⁻³ sample has R ≈ 1.6 Ω, so matched-load power is femtowatts to
sub-picowatts. APS's page bot-check was not completed (rule: never), so the 1959 paper stays at
metadata level; its role is constituent.

## Applied

1. The handoff (findings 1–4): GENUINE composition; the gas→solid boundary is non-converting
   apparatus, but Weinreich drag needs a travelling wave with directed momentum, which a standing
   wave does not supply. New token `acoustic:travelling-wave`; new regime claim
   `claim:thermoacoustic-produces-travelling-sound` (Yazaki 1998, Backhaus & Swift 2000; provides the
   token; the generic sound claim untouched so standing-wave engines keep their spelling);
   `claim:acoustic-wave-drives-acoustoelectric` now requires the token and carries the three
   conditions and the tags [state-solid, medium-semiconductor]. The generic spelling
   (p-690d387078) is incomplete-handoff and dominated; the travelling-wave spelling
   (p-231472e45e) is the candidate — the same pattern as the confined-plug Marangoni claim of
   pass 23. The plan is re-pointed to p-231472e45e.
2. Relations (findings 5–8): Swift's critical gradient on `claim:thermoacoustic-drives`
   (|∇T_crit| = β T_m ω |p₁| / (ρ_m c_p |u₁|), input acoustic pressure, output temperature gradient,
   K/(Pa·m)) and the Weinreich relation on the acoustoelectric step (|j_AE| = μ |Γ| I_s / v_s, input
   the new `quantity:acoustic-intensity`, output current density, A/W, magnitude form with the
   sign convention in `conventions`; evidence Weinreich 1957 + Weinreich, Sanders & White 1959,
   plus Atashbar 2026 as the modern SAW demonstration). The dimensional check passes on the route.
3. The magnitude screen (a lane finding while applying 2): no route in the atlas had ever been
   `bounded`, because the screen asked every process step for a relation and `produces` steps never
   carry one. It now asks only the steps that can carry one — drives, couples_to, or an explicit
   `relation_requirement: required` — the notion the dimensional check already used; documented in
   /methods and data-api. Eleven routes are bounded; p-231472e45e is the first bounded candidate
   (coverage 2/2). Put to the reviewer in pass 26 as a lane decision.
4. The estimate (findings 9–12) stays here, never on a claim: ≈ 0.5 W of 710 W crosses a bare
   helium–germanium interface; nanoamps to a microamp of acoustoelectric current; femtowatts to
   sub-picowatts into a matched load; the interface costs three orders of magnitude, the carrier-
   drag/load stage is the dominant bottleneck for useful power.
5. The record (findings 13–17): `search:2026-09-21-p-231472e45e-partial` with the reviewer's web
   search as a manual run and five verified hits — Zheng 2022 wrong-coupling, Weinreich–Sanders–
   White 1959 constituent-only, Atashbar 2026 source-variant, Backhaus & Swift 2000 and Yazaki 1998
   constituent-only; inconclusive / partial; the engines are pass 26's first job.
6. A known device the atlas had not spelled (lane addition from finding 14, verified on the
   abstract): `pathway:thermoacoustic-piezoelectric-harvester` (Zheng 2022, K5, demonstrated) with
   the consumer claim `claim:acoustic-wave-drives-piezoelectric`, a transducer and implemented_by
   claims; the pathway's measurements are the engine-driven 102 V / 10 μA and the loudspeaker
   characterisation 392 mW m⁻² with its conditions stated. Put to the reviewer for confirmation.
7. Sources: six added, each with its verification noted. Tests: two frontier tests (the two
   spellings; the screen's bounded semantics), 65/65.

Result: revision c3c317847bc7 — 497 claims · 192 sources · 87 pathways · 907 routes · 81
demonstrated · 8 reviewed searches · 10 candidate compositions (one bounded) · 65/65 · axe clean ·
exports valid · live. Pass 26 (finding 19): the deferred OpenAlex work when the budget resets —
p-231472e45e's forms first, then the thermoflexoelectric rerun for p-a093d7ecc5; P3 (the thermal
Marangoni rotor → generator) is pass 27.
