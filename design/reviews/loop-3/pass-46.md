# Pass 46 — the PEC architecture bounds (21/09/2026 9:50–10:05 pm Sydney, build; message after)

Built on the reviewer's pass-45 order (findings 8–14): Fountaine, Lewerenz & Atwater 2016's limits
typed by architecture and assumption set, and Cheng 2018's exact tandem as a narrow record of its
own — on the same route as the generic photoelectrochemical pathway, which keeps no gap-pair ceiling.

## Built

1. Sources: `source:fountaine-2016-pec-limits` (Nature Communications 7, 13706; open; read in full
   including Table 1's three parameter bundles — Ideal f_abs 1 / ERE 1 / j0,cat ∞ / r_s 0 / r_sh ∞;
   Real1 0.9 / 0.03 / {1, 10⁻³} mA cm⁻² / 0 / ∞; Real2 0.9 / 10⁻⁶ / {1, 10⁻⁵} / 0.1 / 10); Cheng 2018's
   note extended from the arXiv full text (1706.01493): Ga₀.₄₁In₀.₅₉P / Ga₀.₈₉In₀.₁₁As 1.78 / 1.26 eV by
   MOVPE, ALD TiO₂, Rh; 19.3 % acidic / 18.5 % pH 7; "a theoretical efficiency of 22.8 % under AM 1.5G
   conditions can be reached, assuming 100 % above bandgap absorption and 100 % external radiative
   efficiency", SQwater with j0,cat {1, 10⁻³} mA cm⁻², R_S = 0, R_SH = ∞ (Figure 1c); Table S1 19.3 /
   22.8 = 0.85.
2. Five constraint entities: the ideal single-junction limit (upper bound 0.306; E_g 1.59 eV at the
   maximum) and dual-junction limit (0.400; 0.52 / 1.40 eV; a third junction adds nothing, 28.3 %),
   each with `requires_basis` "PEC water splitting, single-/dual-junction absorber, AM1.5G" — the
   reviewer's guard that these bound water splitting, not every manifestation of the
   photoelectrochemical effect (finding 11); two benchmarks (never decisive) for the realistic cases,
   named after the source's words "realistic limiting efficiencies" and carrying Table 1's parameter
   bundles in their bound text — Real1 15.1 % / 28.3 % (2.05 eV; 1.59 / 0.92 eV), Real2 5.4 % / 16.2 %
   (2.53 eV; 1.93 / 1.38 eV) (findings 12–13); and Cheng's pair-specific limit
   `constraint:pec-tandem-gainp-gainas-1p78-1p26ev-limit` (upper bound 0.228, the same dual-junction
   basis, its assumptions in the bound text). Four claims on phenomenon:photoelectrochemical-effect:
   two `bounded_by` (the ideal limits) and two `governed_by` (the benchmarks, like Curzon–Ahlborn).
3. The variant mechanism (finding 8–10 needed a narrower pathway on the same physics): a pathway may
   declare `variant_of` — a narrower recorded architecture with exactly its parent's claim sequence
   (loader-checked; a variant cannot have variants). The compiler keeps the parent as the route's
   `pathway`, excludes variants from the overlap and frontier machinery, and evaluates each variant's
   eight checks for its own data and bounds into `CompiledPath.variants[] = { pathway, checks[] }`;
   the index maps a variant to its route; the route page lists "Recorded variants on this exact
   route" with each variant's data, bounds and its thermodynamic-bound and coverage results.
4. `pathway:tandem-pec-gainp-gainas-1p78-1p26ev` ("Tandem PEC photocathode, GaInP/GaInAs 1.78 /
   1.26 eV (Cheng 2018)", `variant_of` the generic pathway, demonstrated, K5): the 19.3 % (acidic
   perchlorate) and 18.5 % (pH 7) data moved onto it with the basis "PEC water splitting, dual-junction
   absorber, AM1.5G" and the STH definition, device and electrolyte in their conditions; `bounds[]`
   names the pair-specific limit with Cheng 2018 and Fountaine 2016 as evidence and the condition
   that the global dual-junction maximum reaches the same route through the phenomenon. The generic
   pathway's measurements are now empty (pass 46 comment).
5. Results: the generic route reads unresolved — Landsberg and the two ideal limits "recorded but not
   evaluable", no datum, the pair limit absent from it (tested); the variant PASSES: 19.3 % ≤ 22.8 %
   (its pair) and ≤ 40.0 % (the dual-junction ideal), 18.5 % likewise; the single-junction ideal
   correctly reports "does not state the basis" for a dual-junction datum; the Landsberg limit stays
   pending (no T_s_K / T_c_K). The stage-versus-route audit now has 29 rows (the generic pathway's
   row marked moved, two rows on the variant).
6. Regressions: the first suite test admits variants (a variant's route carries its parent and lists
   the variant); the pass-46 test above; loader refusals for a variant whose steps differ and for a
   variant of a variant (temp copies). 86/86.

Result: revision d38bbf3a35e1 — 353 entities · 524 claims · 234 sources · 93 pathways (92 + 1
variant) · 2 systems · 771 routes · 86 demonstrated · 86/86 · axe clean · exports valid · four audit
gates consistent · live.
