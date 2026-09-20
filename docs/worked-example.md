# A worked example: one claim, from YAML to route to cell

The whole atlas is this chain repeated 456 times. Follow one claim through it.

## 1. The claim, as written

`data/canonical/claims/thermal.yaml` holds this record (abridged):

```yaml
- id: claim:seebeck-drives
  subject: disequilibrium:temperature-gradient
  predicate: drives
  object: phenomenon:seebeck-effect
  conditions:
    - a spatial temperature difference across a conductor or semiconductor
    - a closed circuit of dissimilar materials, or a single material with ends at different temperatures
  condition_tags: [state-solid, medium-conductor, temp-gradient-required]
  energy: { input: thermal, output: electrical, dissipation: thermal }
  relation:
    formula: "ΔV = S · ΔT"
    input: quantity:temperature-difference
    output: quantity:electric-potential
    coefficient_unit: V/K
    coefficient_name: Seebeck coefficient S
  evidence: [source:seebeck-1826, source:goldsmid-2016, source:callen-1948]
  status: established
```

What the record asserts is only this: _the atlas records that a temperature gradient drives the
Seebeck effect under those conditions, with that energy ledger and that constitutive relation,
supported by those three sources, at the status established_. It says nothing about nature beyond
what the three sources say; if one of them were withdrawn, the record would change, not the world.

The status is not the author's opinion. `established` requires sources from two independent groups,
or a review or book, and a test enforces it (`pipelines/test/build.test.ts`). Seebeck 1826 plus
Goldsmid's 2016 textbook plus Callen 1948 satisfies it. One paper alone would be `demonstrated`.

## 2. Validation

`pnpm validate` refuses the file unless every entity id exists, every source id exists, every
condition tag is in `ontology/conditions.yaml`, and the coefficient unit `V/K` parses against
`ontology/units.yaml`. A claim that cites nothing cannot be `established`.

## 3. Enumeration

The compiler starts at every disequilibrium and follows only the four process predicates (`drives`,
`produces`, `couples_to`, `converts_into`), depth-first, never revisiting a node, at most seven
steps, stopping at an output. One of the routes it finds from `disequilibrium:temperature-gradient`
is:

```
claim:seebeck-drives  →  claim:seebeck-produces-carriers  →  claim:charge-carriers-convert-electricity
temperature gradient → Seebeck effect → charge carriers → electrical work
```

Its id is `p-d4b83f7f17`: ten hex characters of a SHA-1 over that ordered claim sequence, so the same
composition has the same id in every revision.

## 4. The seven checks

Each route is examined by seven checks that return pass / fail / unresolved / unknown and a
sentence. For this route:

- typed chain — pass ("3 typed steps, disequilibrium → output");
- energy-form continuity — pass ("thermal → electrical → electrical → electrical");
- conservation / available free energy — pass ("source exergy positive; every step declares its
  output and losses");
- thermodynamic bound — pass ("applicable: Carnot limit, thermoelectric figure-of-merit bound,
  Onsager reciprocity" — three `bounded_by` claims recorded against the Seebeck effect; the check
  never assumes Carnot from a thermal source, it reads a claim);
- dimensional — unresolved ("1/3 steps carry a relation; all consistent: ΔV = S · ΔT");
- boundary compatibility — pass ("3 condition tags across 3 steps, no conflicts");
- practical magnitude — pass ("typical efficiency 5.0%, record 12.0%", read from the pathway
  below).

"Unresolved" never means wrong. It means the atlas has not recorded what it would need to decide.

## 5. The named pathway

`data/canonical/pathways/pathways.yaml` records `pathway:thermoelectric-generator` with exactly
this claim sequence, `status: commercial`, `knowledge_level: K8`, and datum-level measurements with
their sources. Because the claim sequence matches, the route inherits the pathway: its search status
becomes `demonstrated`, its frontier class `demonstrated`, and the route page shows the
measurements. This is the only way a route becomes "demonstrated" other than a reviewed search that
found a demonstration.

## 6. Structure and order

The route's structural kind is `composition` (one conversion phenomenon plus a carrier and an
output — the frontier's structural rules treat a single-phenomenon route as `atomic`, but a recorded
pathway is always shown as its own composition). On the frontier, demonstrated routes sit apart from
candidates; among candidates the order is structure, then unresolved core checks, then unresolved
carrier handoffs, then device coverage, then the magnitude screen, then search state, then evidence,
then driver availability, then seams, transitions and length — a lexicographic order, never a score.

## 7. The matrix cell

Row `D.01` is `disequilibrium:temperature-gradient`; column `C.01` is `coupling:thermoelectric`. The
Seebeck, Thomson and Nernst effects are `member_of` that family (`claim:seebeck-member-thermoelectric`
places the first), and three `drives` claims (`claim:seebeck-drives` among them) link the row to
them, so the cell `D.01 × C.01` carries **direct relations** and shows their best status:
_established_. The cell's sheet opens with the
question "Does the atlas record a direct thermoelectric relation driven by temperature gradient?"
and answers it with those claims.

Compare `D.01 × C.23` (temperature gradient × electrokinetic): no `drives` claim links the row to
any electrokinetic phenomenon, but four composed bridges exist (the shortest: temperature gradient
→ thermo-osmosis → streaming potential → ionic current → electricity, route `p-a9a16d56d9`) whose
every constituent is at least demonstrated, so the cell is a **candidate** — a composition of
recorded physics, not a recorded direct relation. A reviewed search of that cell found a physical
experiment (Zhao et al. 2020) and, on reading its mechanism, classified it `route-only`: the paper
demonstrates the composition, not a direct relation, so it became the coupling claim
`claim:thermo-osmosis-couples-streaming` and the cell stayed a candidate. A search can never
manufacture a matrix edge.

## 8. What would change each of these

- the claim: a source withdrawn, or contrary evidence added, changes its status and everything
  downstream;
- the route: a new claim from the Seebeck effect adds routes; a check that starts to fail moves the
  route to `forbidden`;
- the cell: a second reviewed search finding a direct demonstration would make an empty cell
  _demonstrated_; a protocol-complete negative would make it _searched, no demonstration found_;
  nothing else can.

Every number on every page is a count over these records at one dataset revision (`data_hash`).
